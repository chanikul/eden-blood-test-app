/**
 * Feature flags for the Eden Clinic MVP
 * 
 * These flags control which features are enabled in the application.
 * Set to true to enable a feature, false to disable it.
 */

export const features = {
  // Core features (always enabled)
  bloodTests: true,
  userAccount: true,
  
  // Optional features (disabled for MVP)
  bookings: false,
  prescriptions: false,
  travelLetters: false,
  paymentMethods: false,
  subscriptions: false,
  
  // Conditional features
  addresses: process.env.NEXT_PUBLIC_FEATURE_ADDRESSES === 'true',
};

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName] === true;
}
