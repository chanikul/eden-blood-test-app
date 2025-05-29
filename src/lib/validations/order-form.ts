import { z } from 'zod';

const shippingAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'County/State is required'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .regex(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/, 'Invalid UK postal code format'),
  country: z.literal('GB')
});

const baseSchema = z.object({
  // Step 1: Personal Details
  patientName: z.string().min(2, 'Name must be at least 2 characters'),
  patientEmail: z.string().email('Please enter a valid email'),
  patientDateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
      },
      { message: 'You must be at least 18 years old' }
    ),
  patientMobile: z.string().optional(),
  
  // Step 2: Blood Test Selection
  testSlug: z.string().min(1, 'Please select a blood test'),
  notes: z.string().optional(),
  
  // Step 4: Shipping Address
  shippingAddress: shippingAddressSchema
});

export const orderFormSchema = z.discriminatedUnion('createAccount', [
  baseSchema.extend({
    createAccount: z.literal(true),
    password: z.string().min(8, 'Password must be at least 8 characters')
  }),
  baseSchema.extend({
    createAccount: z.literal(false),
    password: z.string().optional()
  })
]);

export type OrderFormData = z.infer<typeof orderFormSchema>;
