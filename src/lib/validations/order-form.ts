import { z } from 'zod';

export const orderFormSchema = z.object({
  // Step 1: Personal Details
  patientName: z.string().min(2, 'Name must be at least 2 characters'),
  patientEmail: z.string().email('Please enter a valid email'),
  patientDateOfBirth: z.string().min(1, 'Date of birth is required'),
  patientMobile: z.string().optional(),
  
  // Step 2: Blood Test Selection
  testSlug: z.string().min(1, 'Please select a blood test'),
  notes: z.string().optional(),
  
  // Step 3: Account Setup (Optional)
  createAccount: z.boolean().default(false),
  password: z.string().optional()
    .refine((val) => {
      if (val === undefined) return true;
      return val.length >= 8;
    }, { message: 'Password must be at least 8 characters' }),
  
  // Step 4: Shipping Address
  shippingAddress: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'County/State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;
