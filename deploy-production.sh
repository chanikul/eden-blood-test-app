#!/bin/bash

# Eden Clinic Production Deployment Script
# This script automates the deployment process to Netlify

# Set error handling
set -e
echo "🚀 Starting Eden Clinic production deployment process..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "⚠️ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
echo "🔑 Checking Netlify authentication..."
netlify status &> /dev/null || (echo "⚠️ Not logged in to Netlify. Please login." && netlify login)

# Ensure the project is linked to a Netlify site
echo "🔗 Ensuring project is linked to Netlify site..."
netlify status | grep -q "Linked" || (echo "⚠️ Project not linked to Netlify site. Linking now..." && netlify link)

# Verify environment variables are set
echo "🔍 Verifying production environment variables..."
netlify env:list | grep -q "DATABASE_URL" || echo "⚠️ Warning: DATABASE_URL not set in Netlify"
netlify env:list | grep -q "DIRECT_URL" || echo "⚠️ Warning: DIRECT_URL not set in Netlify"
netlify env:list | grep -q "JWT_SECRET" || echo "⚠️ Warning: JWT_SECRET not set in Netlify"
netlify env:list | grep -q "STRIPE_SECRET_KEY" || echo "⚠️ Warning: STRIPE_SECRET_KEY not set in Netlify"
netlify env:list | grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" || echo "⚠️ Warning: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set in Netlify"
netlify env:list | grep -q "STRIPE_WEBHOOK_SECRET" || echo "⚠️ Warning: STRIPE_WEBHOOK_SECRET not set in Netlify"
netlify env:list | grep -q "SENDGRID_API_KEY" || echo "⚠️ Warning: SENDGRID_API_KEY not set in Netlify"
netlify env:list | grep -q "NEXT_PUBLIC_SUPABASE_URL" || echo "⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL not set in Netlify"
netlify env:list | grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" || echo "⚠️ Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY not set in Netlify"
netlify env:list | grep -q "SUPABASE_SERVICE_ROLE_KEY" || echo "⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY not set in Netlify"

# Ensure production mode
echo "🔧 Setting production environment..."
netlify env:set NODE_ENV "production"
netlify env:set FORCE_REAL_EMAILS "true"
netlify env:set ENABLE_TEST_DATA_CLEANUP "true"

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Build the application locally to verify it works
echo "🏗️ Building application locally to verify..."
npm run build

# Ask for confirmation before deploying to production
echo ""
echo "⚠️ Ready to deploy to production. This will make your site live."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Deploy to production
echo "🚀 Deploying to production..."
netlify deploy --prod

# Verify deployment
echo "✅ Deployment complete! Verifying site..."
netlify open:site

echo ""
echo "🎉 Eden Clinic has been deployed to production!"
echo "📋 Please complete the post-deployment verification steps in the deployment-checklist.md file."
