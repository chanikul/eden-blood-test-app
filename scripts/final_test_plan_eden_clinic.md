# ✅ Eden Clinic – Final Deployment Test Plan

## 🚀 Deployment Status

- [x] Deployed to Netlify via Windsurf
- [x] Project URL: https://eden-clinic-blood-test-app.windsurf.build
- [x] Project ID: b460bc7f-ae6d-4f51-b52b-f27500e09485
- [x] Project name: eden-clinic-blood-test-app-2wle9

## 🛠️ Deployment Fixes Applied

- [x] Fixed deprecated `export const config` in Stripe webhook API route
  - Replaced with modern Next.js App Router route segment config
  - Added `export const runtime = 'nodejs'`
  - Added `export const dynamic = 'force-dynamic'`
  - Added `export const bodyParser = false` for raw body handling
- [x] Fixed case-sensitivity issues in component imports
  - Renamed `Dialog.tsx` to `dialog.tsx`
  - Updated imports in `admin/reset-password/page.tsx` to use lowercase filenames
  - Previously fixed `Button.tsx`, `Input.tsx`, and `Select.tsx` to lowercase
- [x] Fixed Prisma schema relation issues
  - Added missing relation names to TestResult model
- [x] Updated environment variables for production
  - Set correct URLs for API and base URL
  - Configured email settings for production
  - Disabled test data cleanup and user deletion in production

## 🌐 Environment Setup

- [ ] .env configured with new `edenclinicformen.com` emails
- [ ] `FORCE_REAL_EMAILS=true`
- [ ] `NODE_ENV=production`
- [ ] `BASE_URL` pointing to deployment domain
- [ ] Supabase keys + Stripe keys are valid

---

## 📦 Test Data Preparation

- [ ] 1 test Stripe product (blood test)
- [ ] 1 test client user (e.g. testclient@edenclinicformen.com)
- [ ] 1 test admin user (e.g. admin@edenclinicformen.com)

---

## 🧪 Full Test Flow

### 1. Order Placement

- [ ] Fill out order form
- [ ] Complete payment (Stripe test card)
- [ ] Redirect to success page

### 2. Email Verification (Post-Order)

- [ ] Client receives **styled Order Confirmation**
- [ ] Admin receives **styled Order Notification**
- [ ] (Optional) Welcome Email for new clients
- [ ] All emails sent **exactly once**
- [ ] No fallback/plaintext versions

### 3. Admin Order Handling

- [ ] Login via Google SSO with `@edenclinicformen.com`
- [ ] Upload PDF to order
- [ ] Mark status to `ready`
- [ ] Triggers exactly 1 **styled result email** to client (no PDF attached)

### 4. Client Result Retrieval

- [ ] Client logs in
- [ ] Sees order in dashboard
- [ ] Can download PDF securely
- [ ] Can’t view other clients’ files

---

## 🔒 Security Checks

- [ ] Admin access restricted to `@edenclinicformen.com` or `@edenclinic.co.uk`
- [ ] MFA/OTP working for admin
- [ ] Supabase RLS prevents unauthorized access to client data
- [ ] No exposed Supabase public URLs

---

## 🧹 Final Cleanup

- [ ] “Clean Up Test Data” button removed
- [ ] Logs and console are clean
- [ ] All test data removed post-test

---

## 📤 WindSurf Final Prompt

```ts
Thanks — that’s great. For this final round, please focus specifically on:

1. ✅ Email Flow Integrity
   - Make sure each email (order confirmation, admin notification, welcome, and result-ready) is:
     - Sent exactly once
     - Using the styled React Email templates
     - Sent from admin@edenclinicformen.com
     - Never duplicated on retries or page reloads
     - No fallback/plaintext emails

2. ✅ Client Result Notification
   - When an admin marks an order as “ready”:
     - Only one email should go to the client
     - It must be styled and contain a login link (no PDF attachment)

3. ✅ Supabase Storage Access Control
   - Ensure result PDFs are only accessible when logged in as the correct user
   - No public file links
   - Confirm Supabase RLS policies are active and correctly scoped to the user's UID

4. ✅ Admin Login
   - Google Sign-In should allow both @edenclinic.co.uk and @edenclinicformen.com
   - MFA (email OTP) must work
   - “Clean Up Test Data” button must be removed or disabled

Optional: please seed 1 test order + 1 admin user + 1 client user using edenclinicformen.com domain so I can run through the UI manually before going live.
```
