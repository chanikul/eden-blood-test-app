# Eden Clinic Production Deployment Checklist

## Environment Variables Setup

### Supabase Configuration
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to your production Supabase URL
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your production Supabase anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` to your production Supabase service role key
- [ ] Ensure Supabase RLS policies are properly configured for production

### Database Configuration
- [ ] Set `DATABASE_URL` to your production PostgreSQL connection string
- [ ] Set `DIRECT_URL` to your production PostgreSQL direct connection string
- [ ] Run `prisma generate` to ensure Prisma client is up-to-date

### Authentication
- [ ] Set `JWT_SECRET` for secure JWT token signing
- [ ] Set `NEXT_PUBLIC_JWT_SECRET` (if needed for client-side verification)
- [ ] Ensure Google OAuth credentials are configured for production domain

### Payment Processing
- [ ] Set `STRIPE_SECRET_KEY` to production Stripe key
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to production Stripe publishable key
- [ ] Set `STRIPE_WEBHOOK_SECRET` for production webhook endpoint
- [ ] Update Stripe webhook URLs to point to production domain

### Email Configuration
- [ ] Set `SENDGRID_API_KEY` to production SendGrid API key
- [ ] Set `SENDGRID_FROM_EMAIL` to your verified sender email
- [ ] Set `SUPPORT_EMAIL` to your support email address
- [ ] Set `FORCE_REAL_EMAILS=true` to ensure emails are sent to real recipients

### Application URLs
- [ ] Update `NEXT_PUBLIC_API_URL` to your production domain
- [ ] Update `NEXT_PUBLIC_BASE_URL` to your production domain
- [ ] Update `BASE_URL` to your production domain

### Feature Flags
- [ ] Set `ENABLE_TEST_DATA_CLEANUP=true` for production
- [ ] Set `ENABLE_USER_DELETION=false` for production (unless needed)
- [ ] Disable any development-only features

## Netlify Configuration

### Environment Variables
Run the following commands to set environment variables in Netlify:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your local project to the Netlify site
netlify link

# Set environment variables (replace values with your actual production values)
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://your-production-instance.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-production-anon-key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-production-service-role-key"
netlify env:set DATABASE_URL "postgresql://user:password@host:port/database"
netlify env:set DIRECT_URL "postgresql://user:password@host:port/database"
netlify env:set JWT_SECRET "your-production-jwt-secret"
netlify env:set STRIPE_SECRET_KEY "your-production-stripe-secret-key"
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "your-production-stripe-publishable-key"
netlify env:set STRIPE_WEBHOOK_SECRET "your-production-stripe-webhook-secret"
netlify env:set SENDGRID_API_KEY "your-production-sendgrid-api-key"
netlify env:set SENDGRID_FROM_EMAIL "noreply@edenclinicformen.com"
netlify env:set SUPPORT_EMAIL "support@edenclinicformen.com"
netlify env:set FORCE_REAL_EMAILS "true"
netlify env:set NEXT_PUBLIC_API_URL "https://your-production-domain.com"
netlify env:set NEXT_PUBLIC_BASE_URL "https://your-production-domain.com"
netlify env:set BASE_URL "https://your-production-domain.com"
netlify env:set ENABLE_TEST_DATA_CLEANUP "true"
netlify env:set ENABLE_USER_DELETION "false"
netlify env:set NODE_ENV "production"
```

## Pre-deployment Tasks

### Database Migration
- [ ] Run `npx prisma migrate deploy` to apply all migrations to production database
- [ ] Verify database schema is correctly deployed

### Content Security Policy
- [ ] Update CSP headers in `next.config.js` to include production domains
- [ ] Ensure all third-party domains (Stripe, SendGrid, etc.) are included in CSP

### Build and Test Locally
- [ ] Run `npm run build` to verify build succeeds
- [ ] Test the production build locally with `npm start`

## Deployment

### Preview Deployment
```bash
# Deploy to preview URL
netlify deploy
```

### Production Deployment
```bash
# Deploy to production
netlify deploy --prod
```

## Post-deployment Verification

### Authentication
- [ ] Verify user login works correctly
- [ ] Verify user registration works correctly
- [ ] Verify admin login works correctly

### Data Access
- [ ] Verify client dashboard loads correctly
- [ ] Verify admin dashboard loads correctly
- [ ] Verify test results are accessible

### Payment Processing
- [ ] Complete a test purchase
- [ ] Verify Stripe webhooks are working
- [ ] Verify order creation in database

### Email Notifications
- [ ] Verify welcome emails are sent
- [ ] Verify order confirmation emails
- [ ] Verify test result notification emails

### File Storage
- [ ] Verify file uploads work correctly
- [ ] Verify file downloads work correctly

## Rollback Plan

In case of deployment issues:
1. Revert to previous deployment in Netlify dashboard
2. Restore database from backup if needed
3. Check Netlify function logs for errors
