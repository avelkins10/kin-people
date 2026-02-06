# Pilot Setup Workflow

Step-by-step workflow for setting up pilot users.

---

## Prerequisites

- Production database deployed and migrated
- Environment variables configured:
  - `DATABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
- Access to production Supabase project

---

## Step-by-step workflow

1. **Configure pilot office details**  
   In `scripts/create-pilot-users.ts`, set `PILOT_OFFICE_NAME` to match the office name you will create. Run the pilot seeding function (e.g. from a one-off script or REPL) to create the pilot office and roles:
   - Call `seedPilotData(officeName, officeRegion, officeStates, officeAddress, includePilotPayPlans)` from `lib/db/seed.ts` with your pilot office details.

2. **Run pilot data seeding**  
   Execute the pilot seeding function to create the pilot office and the four roles (Admin, Area Director, Team Lead, Sales Rep). Optionally seed pay plans.

3. **Configure pilot users**  
   In `scripts/create-pilot-users.ts`, edit the `PILOT_USERS` array with real emails, names, roles, relationships (`reportsToEmail`, `recruitedByEmail`), and temporary passwords.

4. **Create pilot users**  
   Run:
   ```bash
   npm run db:seed-pilot
   ```
   This creates Supabase Auth users (with `email_confirm: true`) and person records linked via `authUserId`.

5. **Verify setup**  
   Run:
   ```bash
   npm run db:verify-pilot
   ```
   Confirm all users have valid `authUserId`, role, office, and relationships.

6. **Document credentials**  
   Fill in `docs/pilot-setup.md` with office details, user accounts, temporary passwords, and IDs. Keep this file out of the repo (see Security below).

7. **Test login**  
   Manually test login for each role (Area Director, Team Lead, Sales Rep) to verify authentication and permissions.

8. **Secure credentials**  
   Store `pilot-setup.md` in a secure location (password manager, encrypted storage). Remove it from the repository or ensure it is in `.gitignore` and never contains real passwords in committed form.

9. **Distribute credentials**  
   Send credentials to pilot participants via a secure channel (encrypted email, password manager share).

---

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| Auth user creation fails | `SUPABASE_SERVICE_ROLE_KEY` is correct and has admin privileges. |
| Person creation fails | `roleId` and `officeId` exist in the database (run pilot seeding first). |
| Relationships fail | `reportsToEmail` and `recruitedByEmail` reference users in the same batch. |
| Login fails | `authUserId` on the person record matches the Supabase Auth user ID. |
