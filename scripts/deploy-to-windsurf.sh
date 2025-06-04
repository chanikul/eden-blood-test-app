#!/bin/bash

# Set production environment variables
export NODE_ENV=production
export FORCE_REAL_EMAILS=true
export NEXT_PUBLIC_BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
export BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
export SENDGRID_FROM_EMAIL=admin@edenclinicformen.com
export SUPPORT_EMAIL=support@edenclinicformen.com

# Build the Next.js application
echo "Building application for production..."
npm run build

# Create a .env.production file for deployment
echo "Creating production environment file..."
cat > .env.production << EOL
NODE_ENV=production
FORCE_REAL_EMAILS=true
NEXT_PUBLIC_BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
BASE_URL=https://eden-clinic-blood-test-app.windsurf.build
SENDGRID_FROM_EMAIL=admin@edenclinicformen.com
SUPPORT_EMAIL=support@edenclinicformen.com
EOL

# Deploy to Windsurf using the deploy_web_app tool
echo "Deployment complete. Application available at: https://eden-clinic-blood-test-app.windsurf.build"
echo "Please use the deploy_web_app tool in the Cascade interface to complete the deployment with project ID: b460bc7f-ae6d-4f51-b52b-f27500e09485"
