// Keys for email templates in app_settings
export const EMAIL_TEMPLATE_KEYS = {
  welcome: "email_template_welcome",
  reminder: "email_template_reminder",
  completion: "email_template_completion",
} as const;

export type EmailTemplateType = keyof typeof EMAIL_TEMPLATE_KEYS;

export interface EmailTemplate {
  subject: string;
  body: string;
}

// Default templates - these match the hardcoded templates in email-service.ts
export const DEFAULT_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  welcome: {
    subject: "Welcome to the team{{officeName}}!",
    body: `<!DOCTYPE html>
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
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <p style="font-size: 16px;">
      We're excited to have you join us{{officeName}}!
      {{managerName}}
    </p>

    <p style="font-size: 16px;">
      To get started, please complete your onboarding tasks. We've prepared everything you need to hit the ground running.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{portalUrl}}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
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
</html>`,
  },
  reminder: {
    subject: "Reminder: {{pendingTaskCount}} onboarding task{{taskPlural}} remaining",
    body: `<!DOCTYPE html>
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
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <p style="font-size: 16px;">
      Just a friendly reminder that you have <strong>{{pendingTaskCount}} onboarding task{{taskPlural}}</strong> remaining to complete.
    </p>

    <p style="font-size: 16px;">
      Completing these tasks helps ensure you have everything you need to be successful in your new role.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{portalUrl}}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Continue Onboarding
      </a>
    </div>

    {{managerHelp}}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This is an automated reminder from your onboarding system.
    </p>
  </div>
</body>
</html>`,
  },
  completion: {
    subject: "Congratulations! You've completed onboarding",
    body: `<!DOCTYPE html>
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
    <p style="font-size: 16px;">Hi {{firstName}},</p>

    <p style="font-size: 16px;">
      <strong>You've successfully completed all your onboarding tasks!</strong>
    </p>

    <p style="font-size: 16px;">
      This is a great milestone. You now have everything you need to start making an impact in your new role.
    </p>

    {{managerNotification}}

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
</html>`,
  },
};

// Available template variables for documentation
export const TEMPLATE_VARIABLES = {
  welcome: [
    { name: "firstName", description: "New hire's first name" },
    { name: "lastName", description: "New hire's last name" },
    { name: "managerName", description: "Manager's name (shows manager intro text if provided)" },
    { name: "officeName", description: "Office name (shows ' at [Office]' if provided)" },
    { name: "portalUrl", description: "Link to the onboarding portal" },
  ],
  reminder: [
    { name: "firstName", description: "New hire's first name" },
    { name: "managerName", description: "Manager's name (shows help text if provided)" },
    { name: "managerHelp", description: "Manager help paragraph (auto-generated if managerName provided)" },
    { name: "pendingTaskCount", description: "Number of pending tasks" },
    { name: "taskPlural", description: "Plural 's' if more than 1 task" },
    { name: "portalUrl", description: "Link to the onboarding portal" },
  ],
  completion: [
    { name: "firstName", description: "New hire's first name" },
    { name: "managerName", description: "Manager's name" },
    { name: "managerNotification", description: "Manager notification paragraph (auto-generated if managerName provided)" },
  ],
} as const;
