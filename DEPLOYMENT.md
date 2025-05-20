# Eden Clinic Deployment Configuration

## Required Environment Variables

Ensure these environment variables are set in your deployment environment:

### Database Configuration
- `DATABASE_URL` - Supabase connection string with pgbouncer
- `DIRECT_URL` - Direct Supabase connection string

### Email Configuration
- `SENDGRID_API_KEY` - SendGrid API key for sending emails
- `SUPPORT_EMAIL` - Support email address for notifications

### Authentication
- `JWT_SECRET` - Secret key for JWT token generation

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe secret key for backend operations
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for frontend
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Deployment Checklist

1. Database
   - [ ] Verify Supabase connection strings are correct
   - [ ] Run database migrations

2. Email
   - [ ] Verify SendGrid API key is valid
   - [ ] Test email sending functionality
   - [ ] Confirm support email is correctly configured

3. Stripe Integration
   - [ ] Confirm Stripe is in the correct mode (test/live)
   - [ ] Verify webhook endpoint is configured in Stripe dashboard
   - [ ] Test payment flow end-to-end
   - [ ] Verify prices match between Stripe and database

4. Frontend
   - [ ] Build and deploy frontend assets
   - [ ] Verify Stripe publishable key is accessible
   - [ ] Test order form submission

5. Security
   - [ ] Ensure all secrets are properly encrypted
   - [ ] Verify JWT secret is secure
   - [ ] Check Supabase security settings

## Post-Deployment Verification

1. Create a test order with these steps:
   - Select a blood test
   - Fill out patient information
   - Complete test payment
   - Verify webhook receives event
   - Confirm emails are sent
   - Check order in admin dashboard

2. Monitor logs for:
   - Successful webhook events
   - Email delivery status
   - Payment confirmations
   - Database operations

## Troubleshooting

If emails are not being sent:
1. Check SENDGRID_API_KEY is correct
2. Verify SUPPORT_EMAIL is valid
3. Monitor SendGrid activity logs

If payments fail:
1. Verify STRIPE_SECRET_KEY and publishable key match
2. Check webhook configuration
3. Monitor Stripe dashboard events
