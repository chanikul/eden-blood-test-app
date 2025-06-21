# Onboarding New Developer Guide — Eden Clinic Apps

Last updated: June 2025

---

## 🎯 Purpose

This guide helps new developers quickly get up to speed with the Eden Clinic application ecosystem. It covers environment setup, access requirements, codebase orientation, and development best practices.

---

## ✅ Initial Access Requirements

Before starting development, ensure the new developer has:

- [ ] GitHub access to the Eden Clinic repositories
- [ ] Supabase access (read/write for development, read-only for production)
- [ ] Stripe test environment access (if working on payment flows)
- [ ] SendGrid API access (if working on email notifications)
- [ ] Google Cloud OAuth client credentials (for local development)
- [ ] Netlify access for deployments and environment variables
- [ ] Access to project management tools (Jira, Trello, etc.)
- [ ] Team communication channels (Slack, Discord, etc.)

---

## ✅ Local Development Setup

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn
- Git
- Code editor (VS Code recommended with extensions below)

### VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense (if using Tailwind)
- Prisma (if using Prisma)
- GitLens
- Error Lens

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/edenclinic/eden-blood-test-app.git
   cd eden-blood-test-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in required values (see "Environment Variables" section)

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## ✅ Environment Variables

Ensure the following environment variables are set in `.env.local`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=no-reply@edenclinic.co.uk

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Always use test credentials for local development!

---

## ✅ Codebase Orientation

### Project Structure

- `/src` - Main source code
  - `/app` - Next.js App Router pages and API routes
  - `/components` - React components
  - `/lib` - Utility functions and services
  - `/types` - TypeScript type definitions
  - `/styles` - Global CSS styles
- `/public` - Static assets
- `/prisma` - Prisma schema and migrations (if applicable)
- `/docs` - Project documentation

### Key Files

- `src/app/layout.tsx` - Root layout component
- `src/lib/stripe.ts` - Stripe client initialization
- `src/lib/supabase.ts` - Supabase client initialization
- `src/app/api/products/route.ts` - API endpoint for blood test products
- `src/components/BloodTestOrderFormWrapper.tsx` - Main blood test ordering component

---

## ✅ Development Workflow

### Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit regularly with descriptive messages:
   ```bash
   git commit -m "feat: add blood test filtering"
   ```

3. Push your branch and create a pull request:
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Request code review from a team member

### Testing

- Run unit tests:
  ```bash
  npm run test
  ```

- Test Stripe webhooks locally:
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

### Deployment

- Preview deployments are automatically created for pull requests
- Production deployments require approval and are triggered from the `main` branch

---

## ✅ Common Issues & Solutions

### Stripe Products Not Appearing

- Verify products have `metadata.type = 'blood_test'`
- Check products are marked as "Active"
- Run the diagnostic script:
  ```bash
  node scripts/list-stripe-products.js
  ```

### Google OAuth Issues

- Ensure redirect URIs are correctly configured in Google Cloud Console
- Check that environment variables are set correctly
- Verify the OAuth client is enabled

### Supabase Connection Issues

- Check if your IP is allowed in Supabase settings
- Verify your API keys are correct
- Ensure you have the necessary permissions

---

## ✅ Best Practices

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Write unit tests for critical functionality
- Document complex logic with comments
- Update documentation when making significant changes
- Use environment variables for all configuration
- Never commit sensitive credentials to Git

---

## 🗂 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference)

---

## 🔄 Project Documentation

Refer to these project-specific documents:

- `/docs/google-auth-setup.md` - Google OAuth configuration
- `/docs/stripe-setup.md` - Stripe integration details
- `/docs/supabase-ownership.md` - Supabase project management
- `/docs/deployment-checklist.md` - Pre-deployment verification
- `/docs/future-app-template.md` - Template for future Eden Clinic apps

---

# 🚀 Ready to Contribute!

Welcome to the Eden Clinic development team! If you have any questions, don't hesitate to reach out to the team lead.
