# Environment Variables Setup

This document describes the environment variables required for the Eden Clinic application.

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Application URLs
```
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_BASE_URL=your_base_url
BASE_URL=your_base_url
```

### Email Configuration
```
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_sender_email
SUPPORT_EMAIL=your_support_email
```

## Development vs Production

For development, you can create a `.env.local` file with these variables.
For production (Netlify), set these in your Netlify environment variables dashboard.

## Security Notes

1. **NEVER commit actual API keys or secrets to the repository**
2. **ALWAYS use environment variables for sensitive information**
3. If you need to regenerate compromised keys:
   - For Supabase: Go to Project Settings > API > API Keys
   - For Google API: Go to Google Cloud Console > APIs & Services > Credentials

## After Rotating Keys

After generating new API keys, make sure to update:
1. Your local `.env.local` file
2. Netlify environment variables
3. Any other deployment environments
