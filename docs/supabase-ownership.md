# Supabase Ownership Transfer Guide

This document outlines the process for transferring ownership of a Supabase project for the Eden Clinic application.

## Prerequisites

- Access to the current Supabase project
- Organization owner or admin privileges
- Email address of the new owner

## Understanding Supabase Organizations and Projects

### Organizations

In Supabase, an **Organization** is the top-level entity that contains projects. Organizations can have multiple members with different roles:
- **Owner**: Has full administrative control
- **Administrator**: Can manage projects and members
- **Developer**: Can access projects but cannot manage organization settings

### Projects

**Projects** exist within Organizations. Each project has its own:
- Database
- Authentication settings
- Storage buckets
- Edge Functions
- API endpoints

## Ownership Transfer Process

### 1. Transfer Organization Ownership

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select the Organization containing the Eden Clinic project
3. Navigate to "Settings" > "Members"
4. Click "Invite" to add the new owner (if they're not already a member)
   - Enter their email address
   - Select "Administrator" role
   - Click "Invite"
5. Once the new user has accepted the invitation:
   - Find their name in the members list
   - Click the three dots menu (...)
   - Select "Transfer ownership"
   - Confirm the transfer

### 2. Update Project Settings

After transferring organization ownership, ensure the following settings are reviewed:

1. **Database Access**:
   - Navigate to "Project Settings" > "Database"
   - Verify the database password is known to the new owner
   - Consider resetting the database password for security

2. **API Keys**:
   - Navigate to "Project Settings" > "API"
   - Note that transferring ownership doesn't invalidate existing API keys
   - Consider regenerating the JWT secret and API keys if needed

3. **Authentication Settings**:
   - Navigate to "Authentication" > "Providers"
   - Verify all OAuth providers (especially Google) are properly configured
   - Ensure redirect URLs are correct

4. **Environment Variables**:
   - Update the following environment variables in your deployment platform:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

### 3. Update Deployment Settings

1. If using Netlify or Vercel, update environment variables in the deployment settings
2. Ensure the new owner has access to the deployment platform
3. Test the application to verify all Supabase features work correctly

## Backup Before Transfer

Before transferring ownership, it's recommended to create a backup:

1. Navigate to "Project Settings" > "Database"
2. Click "Backups"
3. Click "Create backup"
4. Download the backup file once it's created

## Post-Transfer Verification

After transferring ownership, verify the following:

1. **Authentication**: Test login flows (email, Google OAuth)
2. **Database Access**: Verify data can be read and written
3. **Storage**: Test file uploads and downloads
4. **Edge Functions**: Verify any deployed edge functions work correctly

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - If the application stops working after transfer, check that environment variables are updated
   - Verify API keys have the necessary permissions

2. **OAuth Configuration**:
   - If Google login stops working, verify the OAuth configuration in both Supabase and Google Cloud Console
   - Ensure redirect URLs are correctly set

3. **Database Connection Issues**:
   - Check if IP allow list settings were changed
   - Verify database connection strings are updated

## Additional Resources

- [Supabase Documentation on Organizations](https://supabase.com/docs/guides/platform/organizations)
- [Supabase Access Control Guide](https://supabase.com/docs/guides/auth/managing-user-data)
- [Database Backup and Restore](https://supabase.com/docs/guides/platform/backups)

## Contact Information

For assistance with Supabase ownership transfer, contact:
- Supabase Support: support@supabase.io
- Eden Clinic Technical Support: [Your support email]
