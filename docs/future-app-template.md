# future-app-template.md — Eden Clinic App Template

Last updated: June 2025

---

## 🎯 Purpose

Establish a clean, consistent project setup for all future Eden Clinic apps.

This template applies to:
- Second Eden Clinic app (currently in planning)
- Any future apps (e.g. Clinic Booking, Patient Portal, Admin Portal)

---

## ✅ Project Stack (Recommended)

| Component | Recommendation |
|-----------|----------------|
| Framework | Next.js 14 App Router |
| Database | Supabase (Postgres + Auth + Storage) |
| Payments (if needed) | Stripe |
| Emails | SendGrid |
| OAuth | Google Cloud project under edenclinicformen.com |
| DNS / Domain | Use existing Eden Clinic domains |

---

## ✅ Google Cloud Setup

- Use existing Eden Clinic Google Cloud Project (`edenclinicformen.com`)
- OAuth Clients:
  - Use same project for all app OAuth Clients
  - Name clients clearly: `Eden Clinic Blood Test App`, `Eden Clinic Booking App`, etc.
- Authorized Redirect URIs:
  - Add per-app callback (e.g. `/admin/callback`, `/auth/callback`)
- Enable:
  - Google OAuth API
  - reCAPTCHA (if used)
  - Google Drive / Gmail APIs only if needed

- Supabase Studio Access:
  - Only allow **edenclinicformen.com** accounts
  - Remove personal Gmail accounts

---

## ✅ Supabase Setup

- Recommended: Create a new Supabase Project per app
  - Or use shared project with strict RLS per app if needed (complex)
- Enable Row Level Security (RLS) from day one
- MFA required for Admin login
- Backups enabled
- Project Ownership:
  - Only `edenclinicformen.com` accounts as Owners

---

## ✅ Stripe Setup

- Use shared Eden Clinic Stripe account
- Environment separation:
  - Test keys in dev / preview
  - Live keys in production
- Create products in both Test and Live modes
- Use consistent metadata:
  ```txt
  type = blood_test
  type = booking
  type = membership
  ```
- Webhook secrets clearly separated per app

---

## ✅ SendGrid Setup

- Use existing Eden Clinic verified domain (no-reply@edenclinic.co.uk)
- Configure Sender Authentication (DKIM, SPF, DMARC)
- Use same API Key across apps if allowed, or separate keys per app
- No personal Gmail SMTP accounts allowed

---

## ✅ GDPR & Security

- ICO registration required for each new data processing flow
- DPA signed with:
  - Stripe
  - Supabase
  - SendGrid
  - Labs (if handling health data)
- All Supabase tables protected with RLS
- No public links to sensitive data
- MFA required for Admins

---

## 🗂 Initial Docs to Include in Each New App

- `/docs/google-auth-setup.md`
- `/docs/stripe-setup.md`
- `/docs/supabase-ownership.md`
- `/docs/deployment-checklist.md`

✅ Reuse from current Blood Test App → adapt where needed.

---

## 🚨 Common Pitfalls to Avoid

- Do not mix personal Gmail OAuth clients
- Do not leave Supabase project owned by personal Gmail account
- Do not deploy app with Stripe Test keys to Production
- Do not send emails via personal Gmail SMTP
- Do not deploy apps without fully tested RLS in Supabase

---

# 🚀 Launch Template Ready!

By following this template → future Eden Clinic apps will be:
✅ Consistent
✅ Secure
✅ GDPR-compliant
✅ Scalable
