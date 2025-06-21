#!/bin/bash

# Create production environment file with all necessary variables
echo "Creating production environment file..."
cat > .env.production << EOL
NODE_ENV=production
FORCE_REAL_EMAILS=true
NEXT_PUBLIC_BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
SENDGRID_FROM_EMAIL=admin@edenclinicformen.com
SUPPORT_EMAIL=support@edenclinicformen.com

# Database and authentication
DATABASE_URL=\${DATABASE_URL}
SHADOW_DATABASE_URL=\${SHADOW_DATABASE_URL}
JWT_SECRET=\${JWT_SECRET}

# Stripe integration
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=\${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

# SendGrid for email
SENDGRID_API_KEY=\${SENDGRID_API_KEY}

# Supabase for storage
NEXT_PUBLIC_SUPABASE_URL=\${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=\${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=\${SUPABASE_SERVICE_KEY}

# Disable test data cleanup in production
ENABLE_TEST_DATA_CLEANUP=false
ENABLE_USER_DELETION=false
EOL

echo "Production environment file created successfully."
echo "Note: This script preserves existing environment variable values from the deployment platform."
echo "Make sure all required environment variables are set in your Netlify environment settings."
