#!/bin/bash

# Eden Clinic Production Deployment Script
# This script prepares and pushes changes to GitHub for continuous deployment

# Set error handling
set -e
echo "🚀 Starting Eden Clinic production deployment process..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git and try again."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "❌ Not in a git repository. Please run this script from the root of your git repository."
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️ You have uncommitted changes."
    git status --short
    
    read -p "Do you want to continue and commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Verify production configuration
echo "🔍 Verifying production configuration..."
if [ -f "verify-production-config.js" ]; then
    node verify-production-config.js || {
        echo "❌ Production configuration verification failed."
        echo "Please fix the issues and try again."
        exit 1
    }
else
    echo "⚠️ Production configuration verification script not found."
    echo "Continuing without verification..."
fi

# Build the application locally to verify it works
echo "🏗️ Building application locally to verify..."
npm run build || {
    echo "❌ Build failed. Please fix the issues and try again."
    exit 1
}

# Ask for confirmation before pushing to GitHub
echo ""
echo "⚠️ Ready to deploy to production via GitHub. This will trigger a deployment on Netlify."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Commit changes
echo "📝 Committing changes..."
git add .
git commit -m "Prepare for production deployment" || {
    echo "⚠️ No changes to commit or commit failed."
    echo "Continuing with push..."
}

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main || {
    echo "❌ Push failed. Please fix the issues and try again."
    exit 1
}

echo ""
echo "🎉 Changes pushed to GitHub successfully!"
echo "📋 Netlify will now build and deploy your application."
echo "You can monitor the deployment at: https://app.netlify.com/sites/eden-clinic-blood-test-app-2wle9/deploys"
echo ""
echo "Don't forget to complete the post-deployment verification steps:"
echo "1. Verify authentication works (login/signup)"
echo "2. Test the client dashboard"
echo "3. Test the admin dashboard with the debug banner"
echo "4. Complete a test purchase flow"
echo "5. Verify email notifications"
echo "6. Check file uploads and downloads"
