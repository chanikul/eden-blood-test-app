#!/bin/bash

# Eden Clinic Netlify CLI Deployment Script
# This script deploys the application directly using Netlify CLI

# Set error handling
set -e
echo "🚀 Starting Eden Clinic deployment via Netlify CLI..."

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

# Set production environment variables
echo "🔧 Setting production environment variables..."
echo "Setting NODE_ENV=production..."
netlify env:set NODE_ENV production
echo "Setting FORCE_REAL_EMAILS=true..."
netlify env:set FORCE_REAL_EMAILS true
echo "Setting ENABLE_TEST_DATA_CLEANUP=true..."
netlify env:set ENABLE_TEST_DATA_CLEANUP true
echo "Setting NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false..."
netlify env:set NEXT_PUBLIC_USE_FIREBASE_EMULATOR false

# Run database migrations if needed
echo "🗄️ Do you want to run database migrations before deployment? (y/n)"
read -r run_migrations
if [[ $run_migrations =~ ^[Yy]$ ]]; then
    echo "Running database migrations..."
    npx prisma generate
    npx prisma migrate deploy
fi

# Build the application
echo "🏗️ Building application..."
npm run build || {
    echo "❌ Build failed. Please fix the issues and try again."
    exit 1
}

# Deploy options
echo ""
echo "📋 Deployment Options:"
echo "1. Deploy to preview URL (netlify deploy)"
echo "2. Deploy to production (netlify deploy --prod)"
echo ""
read -p "Choose deployment option (1/2): " deploy_option

if [ "$deploy_option" = "1" ]; then
    echo "🚀 Deploying to preview URL..."
    netlify deploy
elif [ "$deploy_option" = "2" ]; then
    echo "⚠️ You are about to deploy to PRODUCTION. This will make your site live."
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying to production..."
        netlify deploy --prod
    else
        echo "❌ Production deployment cancelled."
        exit 1
    fi
else
    echo "❌ Invalid option. Deployment cancelled."
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "📋 Please complete the post-deployment verification steps:"
echo "1. Verify authentication works (login/signup)"
echo "2. Test the client dashboard"
echo "3. Test the admin dashboard with the debug banner"
echo "4. Complete a test purchase flow"
echo "5. Verify email notifications"
echo "6. Check file uploads and downloads"
