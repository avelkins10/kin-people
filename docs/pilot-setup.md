# Pilot Setup — Reference

> **Security:** Never commit this file with real credentials. Add to .gitignore and store in a secure location (password manager, encrypted storage).

---

## Section 1: Pilot Office Details

| Field        | Value |
| ------------ | ----- |
| Office name  | _(fill after seeding)_ |
| Region       | _(e.g. West, Midwest)_ |
| States       | _(e.g. Utah)_ |
| Address      | _(full address)_ |
| Office ID    | _(fill after seeding)_ |
| Creation date| _(fill after seeding)_ |

---

## Section 2: Pilot User Accounts

| Email | Role | Name | Phone | Hire Date | Setter Tier | Reports To | Recruited By |
| ----- | ---- | ---- | ----- | --------- | ----------- | ----------- | ------------ |
| _(fill)_ | _(Office Manager / Team Lead / Sales Rep)_ | _(Full name)_ | _(phone)_ | _(YYYY-MM-DD)_ | _(if Sales Rep)_ | _(manager email)_ | _(recruiter email)_ |

### CONFIDENTIAL — Temporary Passwords

_(To be changed on first login. Store securely.)_

| Email | Temporary Password |
| ----- | ------------------ |
| _(fill)_ | _(fill)_ |

### Person IDs and Auth User IDs (reference)

| Email | Person ID | Auth User ID |
| ----- | --------- | ------------ |
| _(fill)_ | _(UUID)_ | _(UUID)_ |

---

## Section 3: Role Distribution

- **Office Manager:** 1
- **Team Lead:** 1–2
- **Sales Rep:** 3–7

### Organizational hierarchy

```
Office Manager
  └── Team Lead(s)
        └── Sales Rep(s)
```

_(Update with actual reporting structure after setup.)_

---

## Section 4: Setup Checklist

- [ ] Pilot office created in database
- [ ] Roles seeded (Admin, Office Manager, Team Lead, Sales Rep)
- [ ] Pay plans seeded (if applicable)
- [ ] Supabase Auth users created (5–10 users)
- [ ] Person records created and linked to auth users
- [ ] Reporting relationships configured (reportsToId)
- [ ] Recruiting relationships configured (recruitedById)
- [ ] All users verified with verification script
- [ ] Credentials documented securely
- [ ] Credentials sent to pilot participants via secure channel

---

## Section 5: Access Instructions

- **Production URL:** _(fill)_
- **Login:** Use email and temporary password; change password on first login.
- **Password reset:** Use “Forgot password” on the login page (Supabase Auth flow).
- **Support contact:** _(fill)_
