# Google OAuth Authentication Setup Guide

This document outlines how to set up Google OAuth authentication for the Eden Clinic application.

## Prerequisites

- Google Cloud Platform account
- Access to Google Cloud Console
- Eden Clinic application codebase

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Eden Clinic")
5. Click "Create"

### 2. Configure OAuth Consent Screen

1. In your Google Cloud project, go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace organization)
3. Click "Create"
4. Fill in the required information:
   - App name: "Eden Clinic"
   - User support email: Your support email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
7. Click "Save and Continue"
8. Add test users if needed
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

### 3. Create OAuth Client ID

1. In your Google Cloud project, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name for your OAuth client (e.g., "Eden Clinic Web Client")
5. Add the following Authorized JavaScript origins:
   - `https://eden-clinic-blood-test-app.windsurf.build`
   - `http://localhost:3000` (for development)
6. Add the following Authorized redirect URIs:
   - `https://eden-clinic-blood-test-app.windsurf.build/admin/callback`
   - `http://localhost:3000/admin/callback` (for development)
7. Click "Create"
8. Note down the Client ID and Client Secret

### 4. Configure Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find and enable "Google"
4. Enter the Client ID and Client Secret from the previous step
5. Set the Authorized redirect URI to match what you configured in Google Cloud Console
6. Save the settings

### 5. Update Environment Variables

Add the following environment variables to your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 6. Implement OAuth Sign-In Flow

The application uses Supabase Auth to handle Google OAuth. The main implementation is in:

- `/src/app/admin/login/page.tsx` - Initiates the OAuth flow
- `/admin/callback` - Handles the OAuth callback from Google

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URIs in Google Cloud Console exactly match those in Supabase and your application code.

2. **API Not Enabled**: Make sure the Google People API is enabled in your Google Cloud project.

3. **Invalid Client ID or Secret**: Double-check that you've correctly copied the Client ID and Client Secret.

4. **CORS Issues**: Ensure that the authorized JavaScript origins include your application's domain.

### Debug Tips

- Check browser console for errors
- Verify network requests during the authentication flow
- Ensure environment variables are correctly set in production
- Test the authentication flow in both development and production environments

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
