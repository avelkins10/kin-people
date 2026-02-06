import { Resend } from 'resend';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Resend client - requires RESEND_API_KEY environment variable
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default "from" address - matches Supabase SMTP config
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'The KINNECT Team <team@kinhome.com>';

// Email template types and keys
type EmailTemplateType = 'welcome' | 'reminder' | 'completion';

const EMAIL_TEMPLATE_KEYS: Record<EmailTemplateType, string> = {
  welcome: 'email_template_welcome',
  reminder: 'email_template_reminder',
  completion: 'email_template_completion',
};

interface EmailTemplate {
  subject: string;
  body: string;
}

/**
 * Fetch an email template from the database, falling back to default if not found.
 */
async function getEmailTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
  try {
    const key = EMAIL_TEMPLATE_KEYS[type];
    const result = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      const parsed = JSON.parse(result[0].value);
      if (parsed.subject && parsed.body) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn(`[email-service] Failed to fetch ${type} template from DB, using default:`, error);
  }
  return null;
}

/**
 * Replace template variables with actual values.
 */
function replaceTemplateVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/** Normalize Resend/third-party API errors so we don't expose raw API JSON to users. */
function normalizeEmailError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  // Resend returns JSON like {"type":"error","error":{"type":"api_error","message":"Internal server error"},"request_id":"req_..."}
  if (
    raw.includes("api_error") ||
    raw.includes("request_id") ||
    (raw.trimStart().startsWith("{") && raw.includes("Internal server error"))
  ) {
    return "Email service temporarily unavailable. Please try again later.";
  }
  if (raw.length > 200) return "Email service temporarily unavailable. Please try again later.";
  return raw || "Failed to send email.";
}

export interface WelcomeEmailParams {
  email: string;
  firstName: string;
  lastName?: string;
  managerName?: string;
  officeName?: string;
  onboardingUrl?: string;
}

export interface ReminderEmailParams {
  email: string;
  firstName: string;
  managerName?: string;
  pendingTaskCount: number;
  onboardingUrl?: string;
}

export interface CompletionEmailParams {
  email: string;
  firstName: string;
  managerName?: string;
  managerEmail?: string;
}

/**
 * Send a welcome email to a new hire when they are converted to onboarding status.
 * Called automatically by convertRecruitToOnboarding.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, firstName, lastName, managerName, officeName, onboardingUrl } = params;

  if (!resend) {
    console.warn('[email-service] Resend not configured - skipping welcome email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalUrl = onboardingUrl || `${baseUrl}/onboarding`;

    // Try to get custom template from database
    const customTemplate = await getEmailTemplate('welcome');

    let subject: string;
    let html: string;

    if (customTemplate) {
      // Use custom template with variable replacement
      const variables: Record<string, string> = {
        firstName,
        lastName: lastName || '',
        managerName: managerName ? `<strong>${managerName}</strong> will be your manager and is looking forward to working with you.` : '',
        officeName: officeName ? ` at <strong>${officeName}</strong>` : '',
        portalUrl,
      };
      subject = replaceTemplateVariables(customTemplate.subject, variables);
      html = replaceTemplateVariables(customTemplate.body, variables);
    } else {
      // Use default hardcoded template
      subject = `Welcome to the team${officeName ? ` at ${officeName}` : ''}!`;
      html = generateWelcomeEmailHtml({
        firstName,
        lastName,
        managerName,
        officeName,
        portalUrl,
      });
    }

    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject,
      html,
    });

    console.log('[email-service] Welcome email sent:', { email, messageId: result.data?.id });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[email-service] Failed to send welcome email:', error);
    return {
      success: false,
      error: normalizeEmailError(error),
    };
  }
}

/**
 * Send a reminder email to a new hire about pending onboarding tasks.
 * Can be triggered manually by managers/admins.
 */
export async function sendOnboardingReminderEmail(params: ReminderEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, firstName, managerName, pendingTaskCount, onboardingUrl } = params;

  if (!resend) {
    console.warn('[email-service] Resend not configured - skipping reminder email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalUrl = onboardingUrl || `${baseUrl}/onboarding`;

    // Try to get custom template from database
    const customTemplate = await getEmailTemplate('reminder');

    let subject: string;
    let html: string;

    if (customTemplate) {
      // Use custom template with variable replacement
      const taskPlural = pendingTaskCount !== 1 ? 's' : '';
      const variables: Record<string, string> = {
        firstName,
        managerName: managerName || '',
        managerHelp: managerName ? `<p style="font-size: 14px; color: #6b7280;">If you need help with any tasks, please reach out to ${managerName}.</p>` : '',
        pendingTaskCount: String(pendingTaskCount),
        taskPlural,
        portalUrl,
      };
      subject = replaceTemplateVariables(customTemplate.subject, variables);
      html = replaceTemplateVariables(customTemplate.body, variables);
    } else {
      // Use default hardcoded template
      subject = `Reminder: ${pendingTaskCount} onboarding task${pendingTaskCount !== 1 ? 's' : ''} remaining`;
      html = generateReminderEmailHtml({
        firstName,
        managerName,
        pendingTaskCount,
        portalUrl,
      });
    }

    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject,
      html,
    });

    console.log('[email-service] Reminder email sent:', { email, messageId: result.data?.id });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[email-service] Failed to send reminder email:', error);
    return {
      success: false,
      error: normalizeEmailError(error),
    };
  }
}

/**
 * Send an email when a new hire completes all onboarding tasks.
 * Notifies both the new hire and their manager.
 */
export async function sendOnboardingCompleteEmail(params: CompletionEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, firstName, managerName, managerEmail } = params;

  if (!resend) {
    console.warn('[email-service] Resend not configured - skipping completion email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Try to get custom template from database
    const customTemplate = await getEmailTemplate('completion');

    let subject: string;
    let html: string;

    if (customTemplate) {
      // Use custom template with variable replacement
      const variables: Record<string, string> = {
        firstName,
        managerName: managerName || '',
        managerNotification: managerName ? `<p style="font-size: 16px;">${managerName} has been notified of your completion and will be in touch about next steps.</p>` : '',
      };
      subject = replaceTemplateVariables(customTemplate.subject, variables);
      html = replaceTemplateVariables(customTemplate.body, variables);
    } else {
      // Use default hardcoded template
      subject = `Congratulations! You've completed onboarding`;
      html = generateCompletionEmailHtml({
        firstName,
        managerName,
      });
    }

    // Send to new hire
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      cc: managerEmail ? [managerEmail] : undefined,
      subject,
      html,
    });

    console.log('[email-service] Completion email sent:', { email, messageId: result.data?.id });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[email-service] Failed to send completion email:', error);
    return {
      success: false,
      error: normalizeEmailError(error),
    };
  }
}

// HTML generators for emails
function generateWelcomeEmailHtml(params: {
  firstName: string;
  lastName?: string;
  managerName?: string;
  officeName?: string;
  portalUrl: string;
}): string {
  const { firstName, lastName, managerName, officeName, portalUrl } = params;
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Team</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to the Team!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi ${firstName},</p>

    <p style="font-size: 16px;">
      We're excited to have you join us${officeName ? ` at <strong>${officeName}</strong>` : ''}!
      ${managerName ? `<strong>${managerName}</strong> will be your manager and is looking forward to working with you.` : ''}
    </p>

    <p style="font-size: 16px;">
      To get started, please complete your onboarding tasks. We've prepared everything you need to hit the ground running.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Start Onboarding
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions, don't hesitate to reach out to your manager or HR team.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This email was sent because you were added to our team. If you believe this was a mistake, please contact your HR department.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateReminderEmailHtml(params: {
  firstName: string;
  managerName?: string;
  pendingTaskCount: number;
  portalUrl: string;
}): string {
  const { firstName, managerName, pendingTaskCount, portalUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fef3c7; padding: 20px; border-radius: 8px 8px 0 0; border: 1px solid #fcd34d; border-bottom: none;">
    <h2 style="color: #92400e; margin: 0; font-size: 20px;">Onboarding Reminder</h2>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi ${firstName},</p>

    <p style="font-size: 16px;">
      Just a friendly reminder that you have <strong>${pendingTaskCount} onboarding task${pendingTaskCount !== 1 ? 's' : ''}</strong> remaining to complete.
    </p>

    <p style="font-size: 16px;">
      Completing these tasks helps ensure you have everything you need to be successful in your new role.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Continue Onboarding
      </a>
    </div>

    ${managerName ? `<p style="font-size: 14px; color: #6b7280;">If you need help with any tasks, please reach out to ${managerName}.</p>` : ''}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This is an automated reminder from your onboarding system.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function generateCompletionEmailHtml(params: {
  firstName: string;
  managerName?: string;
}): string {
  const { firstName, managerName } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Complete</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi ${firstName},</p>

    <p style="font-size: 16px;">
      <strong>You've successfully completed all your onboarding tasks!</strong>
    </p>

    <p style="font-size: 16px;">
      This is a great milestone. You now have everything you need to start making an impact in your new role.
    </p>

    ${managerName ? `
    <p style="font-size: 16px;">
      ${managerName} has been notified of your completion and will be in touch about next steps.
    </p>
    ` : ''}

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #166534; font-weight: 600;">You're all set to go!</p>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you have any questions as you get started, don't hesitate to reach out to your team.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This email was sent because you completed your onboarding tasks.
    </p>
  </div>
</body>
</html>
  `.trim();
}
