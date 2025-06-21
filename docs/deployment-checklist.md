# deployment-checklist.md — Eden Clinic Web Apps

Last updated: June 2025

---

## 🎯 Purpose

Provide a consistent pre-deployment checklist for **Eden Clinic apps**:
- Blood Test Ordering App
- Future Eden Clinic apps

Covers:
✅ App testing  
✅ Payments  
✅ Email deliverability  
✅ GDPR prep  
✅ DNS & domain settings  
✅ Final Stripe / Google Cloud / Supabase verification

---

## ✅ App Testing (UI & UX)

- [ ] Blood Test order flow → order test end-to-end with test card
- [ ] Admin Dashboard → login works with MFA → update order status → upload PDF
- [ ] Client Dashboard → see blood test with correct status
- [ ] Client Dashboard → secure PDF download works (no public links)
- [ ] Re-order test flow → days since last order displayed correctly
- [ ] All buttons, forms, links tested across mobile + desktop

---

## ✅ Payments / Stripe Testing

- [ ] Test checkout with:
  - `4242 4242 4242 4242` test card → success
  - Failed card → error handled gracefully
- [ ] Products appear correctly in dropdown (metadata.type = blood_test)
- [ ] Stripe webhook integration verified:
  - Payment succeeded triggers correct order update + emails
- [ ] Stripe Live keys used in Production deploy

---

## ✅ Email Deliverability (SendGrid)

- [ ] Emails sent from **no-reply@edenclinic.co.uk**
- [ ] Order confirmation email → correct format and content
- [ ] Admin notification email → received by clinic team
- [ ] Welcome email sent only once per new user
- [ ] Test "Test Ready" notification email triggered manually
- [ ] DKIM / SPF / DMARC verified for `edenclinic.co.uk`

Check:
https://dmarcian.com/dkim-inspector/
https://www.mail-tester.com/

---

## ✅ GDPR & Data Privacy

- [ ] Supabase RLS policies verified for:
  - ClientUser
  - Order
  - Address
  - Admin
- [ ] ICO Registration completed (Angela to confirm)
- [ ] Data Processing Agreements signed:
  - Stripe
  - Supabase
  - Laboratory partners
- [ ] Privacy Policy + Terms of Service published on production app

---

## ✅ DNS & Domain

- [ ] DNS configured for:
  - https://eden-clinic-blood-test-app.windsurf.build
  - or custom domain (to be defined before public launch)
- [ ] SSL certificate active (HTTPS enforced)
- [ ] DNS records correct for email (DKIM, SPF, DMARC)

---

## ✅ Google Cloud / OAuth

- [ ] All OAuth clients use edenclinicformen.com GCP project
- [ ] Google Cloud OAuth Client → correct redirect URIs configured
- [ ] Supabase Studio team ownership → only edenclinicformen.com accounts
- [ ] No personal Gmail accounts in OAuth or Supabase production settings

---

## ✅ Final Pre-launch Actions

- [ ] Remove any placeholder data in Client Dashboard
- [ ] Verify Google reCAPTCHA enabled if forms exposed publicly
- [ ] Conduct a final full regression test
- [ ] Announce release to Eden Clinic team with release notes
- [ ] Schedule first **live order test** with Angela / Eden Clinic staff

---

# 🚀 Launch!

Once all boxes are ticked → app is ready for **production go-live**.

---

## 🗂 Related Docs

- `/docs/google-auth-setup.md`
- `/docs/stripe-setup.md`
- `/docs/supabase-ownership.md`
