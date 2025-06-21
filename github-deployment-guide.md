# Eden Clinic GitHub-based Deployment Guide

## Current Deployment Configuration
- **Project Name**: eden-clinic-blood-test-app-2wle9
- **Production URL**: eden-clinic-blood-test-app.windsurf.build
- **Repository**: github.com/chanikul/eden-blood-test-app
- **Deployment Method**: Continuous deployment from GitHub

## Transitioning to Production

### 1. Environment Variables

Since your app is deployed via GitHub, you should configure environment variables in the Netlify UI:

1. Log in to your Netlify account
2. Navigate to your site (eden-clinic-blood-test-app-2wle9)
3. Go to **Site settings** > **Environment variables**
4. Add or update the following variables:

```
# Database Configuration
DATABASE_URL=your_production_database_url
DIRECT_URL=your_production_direct_database_url

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Authentication
JWT_SECRET=your_production_jwt_secret
NEXT_PUBLIC_JWT_SECRET=your_production_public_jwt_secret

# Payment Processing
STRIPE_SECRET_KEY=your_production_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_production_stripe_webhook_secret

# Email Configuration
SENDGRID_API_KEY=your_production_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@edenclinicformen.com
SUPPORT_EMAIL=support@edenclinicformen.com
FORCE_REAL_EMAILS=true

# Application URLs
NEXT_PUBLIC_API_URL=https://eden-clinic-blood-test-app.windsurf.build
NEXT_PUBLIC_BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
BASE_URL=https://eden-clinic-blood-test-app.windsurf.build

# Feature Flags
ENABLE_TEST_DATA_CLEANUP=true
ENABLE_USER_DELETION=false

# Node Environment
NODE_ENV=production
```

### 2. Update next.config.js for Production

Ensure your `next.config.js` is properly configured for production:

```javascript
// Check if we're in production mode
const isProd = process.env.NODE_ENV === 'production';

// Update image domains to include your production domain
images: {
  domains: ['eden-clinic-blood-test-app.windsurf.build'],
  unoptimized: true,
},

// Update asset prefix for production
assetPrefix: isProd ? 'https://eden-clinic-blood-test-app.windsurf.build' : '',
```

### 3. Database Migration

Before deploying, ensure your production database is migrated:

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL=your_production_database_url

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Commit and Push Changes

Since you're using GitHub-based deployment, simply commit and push your changes to trigger a deployment:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 5. Monitor Deployment

1. Go to your Netlify dashboard
2. Select your site (eden-clinic-blood-test-app-2wle9)
3. Navigate to the "Deploys" tab
4. Monitor the deployment progress

### 6. Post-Deployment Verification

After deployment completes:

1. Visit your production site: https://eden-clinic-blood-test-app.windsurf.build
2. Verify authentication works (login/signup)
3. Test the client dashboard
4. Test the admin dashboard with the debug banner
5. Complete a test purchase flow
6. Verify email notifications
7. Check file uploads and downloads

### 7. Rollback Plan

If issues occur:

1. In the Netlify dashboard, go to "Deploys"
2. Find a previous working deployment
3. Click "Publish deploy" on that version
4. Investigate and fix issues before attempting another deployment

## Production Monitoring

Consider setting up:

1. **Error Tracking**: Integrate Sentry or similar service
2. **Analytics**: Add Google Analytics or Plausible
3. **Uptime Monitoring**: Use UptimeRobot or Pingdom
4. **Performance Monitoring**: Consider Lighthouse CI

## Backup Strategy

1. **Database Backups**: Set up automated PostgreSQL backups
2. **Supabase Storage**: Enable point-in-time recovery if available
3. **Code Repository**: Ensure GitHub repository has protected branches
