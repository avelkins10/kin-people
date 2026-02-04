/**
 * Script to check SignNow template fields
 * Run with: npx tsx scripts/check-template-fields.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getAccessToken, getTemplates } from "../lib/integrations/signnow";

async function getDocumentDetails(documentId: string, accessToken: string) {
  const response = await fetch(
    `https://api.signnow.com/document/${documentId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get document: ${response.status}`);
  }
  return response.json();
}

async function main() {
  console.log("Fetching SignNow access token...");
  const accessToken = await getAccessToken();
  console.log("Access token obtained.\n");

  console.log("Fetching templates...");
  const templates = await getTemplates();
  console.log(`Found ${templates.length} templates:\n`);

  for (const template of templates) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Template: ${template.name}`);
    console.log(`ID: ${template.id}`);
    console.log("=".repeat(60));

    try {
      const details = await getDocumentDetails(template.id, accessToken);

      // Check for fields
      const fields = details.fields || [];
      const texts = details.texts || [];
      const signatures = details.signatures || [];
      const checkboxes = details.checkboxes || [];

      console.log(`\nFields (${fields.length}):`);
      console.log(JSON.stringify(fields, null, 2));

      console.log(`\nText fields (${texts.length}):`);
      for (const text of texts) {
        console.log(`  - ${text.name || text.label || "(unnamed)"} [prefilled: ${text.prefilled_text || "none"}]`);
      }

      console.log(`\nSignature fields (${signatures.length}):`);
      for (const sig of signatures) {
        console.log(`  - ${sig.name || "(unnamed)"} [role: ${sig.role || "unassigned"}]`);
      }

      // Check roles
      const roles = details.roles || [];
      console.log(`\nRoles (${roles.length}):`);
      for (const role of roles) {
        console.log(`  - ${role.name} [unique_id: ${role.unique_id}]`);
      }

      // Check for any field_invites
      const fieldInvites = details.field_invites || [];
      console.log(`\nField Invites (${fieldInvites.length}):`);
      for (const inv of fieldInvites) {
        console.log(`  - ${inv.email || "(no email)"} [role: ${inv.role}]`);
      }

      // Dump all keys in the response to see what else is available
      console.log(`\nAll response keys: ${Object.keys(details).join(", ")}`);

      // Check for any integration_objects (smart fields)
      if (details.integration_objects) {
        console.log(`\nIntegration Objects (smart fields):`);
        console.log(JSON.stringify(details.integration_objects, null, 2));
      }

    } catch (err) {
      console.error(`  Error fetching details: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\n\nExpected field names from buildFieldValues():");
  console.log("  - name, email, office, role, pay_plan, manager");
  console.log("  - recruiter_name, recruit_name, recruit_email");
  console.log("  - target_office, target_role, target_pay_plan");
}

main().catch(console.error);
