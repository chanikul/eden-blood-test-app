# Eden Clinic Blood Test App - Deployment Validation

This document provides a comprehensive checklist for validating the production deployment of the Eden Clinic blood test application.

## Production Environment

**Live URL**: https://eden-clinic-blood-test-app.windsurf.build

> ⚠️ **IMPORTANT**: All validation must be performed on the production deployment, not the local development server.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Payment Processing**: Stripe
- **Email Service**: SendGrid

## Environment Variables Validation

### Supabase Configuration

| Variable | Status | Validation Steps |
|----------|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ⬜ | Verify URL format is correct and points to production Supabase instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⬜ | Verify key is valid and has appropriate permissions |
| `SUPABASE_SERVICE_ROLE_KEY` | ⬜ | Verify service role key is valid and not exposed to client |
| `JWT_SECRET` | ⬜ | Verify secret exists and does NOT start with a slash (/) |
| `SUPABASE_DB_PASSWORD` | ⬜ | Verify password is set and secure |

### Stripe Configuration

| Variable | Status | Validation Steps |
|----------|--------|-----------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⬜ | Verify key is valid and is production key (not test) |
| `STRIPE_SECRET_KEY` | ⬜ | Verify key is valid, is production key, and not exposed to client |
| `STRIPE_WEBHOOK_SECRET` | ⬜ | Verify webhook secret is configured correctly |

### SendGrid Configuration

| Variable | Status | Validation Steps |
|----------|--------|-----------------|
| `SENDGRID_API_KEY` | ⬜ | Verify API key is valid and has appropriate permissions |
| `SENDGRID_FROM_EMAIL` | ⬜ | Verify email is set to `admin@edenclinicformen.com` |
| `SUPPORT_EMAIL` | ⬜ | Verify email is set to `support@edenclinicformen.com` |

## Build Output Validation

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| API Routes | ⬜ | Verify `/api/products` returns valid JSON |
| Supabase Initialization | ⬜ | Verify Supabase is initialized with production keys (check Network tab) |
| No localhost references | ⬜ | Search `.next/` output for any `http://localhost:3000` values |
| Authentication | ⬜ | Verify SSR and client routes handle unauthorized access correctly |

## End-to-End Functionality Checks

### Authentication

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Client Login | ⬜ | 1. Navigate to `/client/login`<br>2. Enter valid credentials<br>3. Verify successful login and redirect to dashboard |
| Admin Login | ⬜ | 1. Navigate to `/admin/login`<br>2. Enter valid admin credentials<br>3. Verify successful login and redirect to admin dashboard |

### Blood Test Checkout Flow

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Product Selection | ⬜ | 1. Navigate to homepage<br>2. Select a blood test product<br>3. Verify product details display correctly |
| Checkout Process | ⬜ | 1. Proceed to checkout<br>2. Fill in customer details<br>3. Enter test Stripe card (4242 4242 4242 4242)<br>4. Complete payment |
| Order Confirmation | ⬜ | 1. Verify redirect to success page<br>2. Verify order details display correctly |
| Database Record | ⬜ | 1. Check admin dashboard<br>2. Verify order appears in database with correct status |
| Confirmation Email | ⬜ | Verify order confirmation email is received |

### File Management

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Admin File Upload | ⬜ | 1. Login as admin<br>2. Navigate to an order<br>3. Upload test result PDF<br>4. Verify upload completes successfully |
| Client File Download | ⬜ | 1. Login as client<br>2. Navigate to test results<br>3. Verify PDF can be downloaded<br>4. Verify unauthorized users cannot access file |

### Client Management

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Manual Client Creation | ⬜ | 1. Login as admin<br>2. Create new client<br>3. Verify client appears in database<br>4. Verify client can login with credentials |

### API Response Validation

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| API JSON Responses | ⬜ | 1. Test various API endpoints<br>2. Verify they return proper JSON responses<br>3. Verify they don't return HTML or redirect responses |

## Email Template Validation

| Template | Status | Validation Steps |
|----------|--------|-----------------|
| Order Confirmation | ⬜ | Trigger and verify email content and formatting |
| Dispatch Notification | ⬜ | Trigger and verify email content and formatting |
| Test Results Ready | ⬜ | Trigger and verify email content and formatting |
| Password Reset | ⬜ | Trigger and verify email content and formatting |

## Security Checks

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Authentication Required | ⬜ | Verify protected routes require authentication |
| Admin Authorization | ⬜ | Verify admin routes require admin role |
| API Protection | ⬜ | Verify API routes are properly protected |
| Secure Headers | ⬜ | Verify security headers are properly set |

## Performance Checks

| Check | Status | Validation Steps |
|-------|--------|-----------------|
| Page Load Speed | ⬜ | Verify pages load within acceptable time |
| API Response Time | ⬜ | Verify API endpoints respond within acceptable time |
| Mobile Responsiveness | ⬜ | Verify UI works correctly on mobile devices |

## Client Dashboard Reorder Flow

### Client Dashboard UI

| Check | Status | Validation Steps |
|-------|--------|------------------|
| Order Button Visibility | ⬜ | Verify "Order Blood Test" button is visible for logged-in clients |
| Navigation | ⬜ | Verify button navigates to `/order` with proper session state |

### Public Order Form Behavior

| Check | Status | Validation Steps |
|-------|--------|------------------|
| Authentication Skip | ⬜ | Verify authenticated clients skip Step 1 (Patient Info) |
| Direct Landing | ⬜ | Verify authenticated clients land directly on Step 2 (Product Selection) |

### Order Completion

| Check | Status | Validation Steps |
|-------|--------|------------------|
| Product Selection | ⬜ | Verify valid product is selected from Stripe (active + `metadata.type === 'blood_test'`) |
| Checkout Completion | ⬜ | Complete Stripe checkout process |
| Redirect | ⬜ | Verify redirect to `/success` page after successful payment |

### Email Workflow

| Check | Status | Validation Steps |
|-------|--------|------------------|
| Client Email | ⬜ | Verify confirmation email sent to client after order completion |
| Admin Notification | ⬜ | Verify admin receives notification email (if configured) |

### Security & Session

| Check | Status | Validation Steps |
|-------|--------|------------------|
| Authentication Check | ⬜ | Verify only authenticated users can use the dashboard/order flow |
| Unauthorized Redirect | ⬜ | Verify unauthorized access is redirected to login page |
| Session Persistence | ⬜ | Verify session persists securely across all order steps |

## Notes

- All validation checks should be performed against the production URL: https://eden-clinic-blood-test-app.windsurf.build
- Do not use the local development server for final validation
- Mark each item as ✅ when validated or ❌ if issues are found

## Issues Found

| Issue | Severity | Description | Resolution |
|-------|----------|-------------|------------|
|       |          |             |            |

## Validation Completed

**Date**: _____________

**Validated By**: _____________

**Signature**: _____________
