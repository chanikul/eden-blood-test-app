# Eden Clinic Client Dashboard - MVP Version

## Overview

This document outlines the structure of the Eden Clinic client dashboard for the MVP version. The dashboard has been simplified to focus on core functionality while maintaining extensibility for future features.

## Core Features

### Home Dashboard (`/client`)

- Welcome message with user's name and time-based greeting
- Primary CTA: "Order a new blood test"
- Secondary CTA: "Get Support"
- Recent Results section showing the latest blood test results
- Empty state handling for new users with no test results

### My Results (`/client/blood-tests`)

- List of all blood test orders with their status
- Search and filter functionality
- Download links for completed test results
- Order details including Order ID and date
- Empty state handling with clear call-to-action

### Account Details (`/client/account`)

- Basic user profile information
- Account management options

## Feature Flag System

The dashboard uses a feature flag system to easily enable or disable features. This allows for gradual rollout of new functionality without code changes.

### How to Enable Features

1. **Environment Variables**: Features can be enabled via environment variables:

```
NEXT_PUBLIC_FEATURE_ADDRESSES=true
```

2. **Code Configuration**: Features can also be enabled by modifying the `features.ts` file:

```typescript
// src/lib/config/features.ts
export const features = {
  // Core features (always enabled)
  bloodTests: true,
  userAccount: true,
  
  // Optional features (disabled for MVP)
  bookings: false,  // Set to true to enable
  prescriptions: false,
  travelLetters: false,
  paymentMethods: false,
  subscriptions: false,
  
  // Conditional features
  addresses: process.env.NEXT_PUBLIC_FEATURE_ADDRESSES === 'true',
};
```

## Disabled Features (Ready for Future Implementation)

The following features are implemented but disabled in the MVP:

- **Bookings**: Appointment scheduling
- **Repeat Prescriptions**: Prescription management
- **Travel Letter Requests**: Travel documentation
- **Payment Methods**: Saved payment methods
- **Subscriptions**: Subscription management
- **Addresses**: User addresses (conditionally available)

## Data Schema

Each blood test result follows this schema for future-proofing:

```typescript
interface BloodTest {
  id: string;         // Unique identifier
  orderId: string;    // Order reference number
  testName: string;   // Name of the test
  status: string;     // Current status (PENDING, PAID, COMPLETED, CANCELLED)
  date: Date;         // Date of the test
  resultUrl?: string; // Optional URL to download results
}
```

## Integration with Full Eden Clinic Portal

The dashboard is designed to be easily embedded into the full Eden Clinic patient portal. The modular structure and consistent data schema ensure smooth integration.

## Future Development

When implementing new features:

1. Enable the corresponding feature flag
2. Update the navigation in `client/layout.tsx` (already prepared with conditional rendering)
3. Implement or uncomment the feature-specific components
4. Update API endpoints as needed

No code deletion is required to add new features, as all non-MVP components are preserved but commented out.
