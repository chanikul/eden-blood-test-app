import { z } from 'zod';

export const bloodTestOrderSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      return d < now && d > new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    }, 'Please enter a valid date of birth'),
  mobile: z
    .string()
    .regex(/^(\+\d{1,3}[- ]?)?\d{10,}$/, 'Please enter a valid phone number')
    .optional(),
  testSlug: z
    .string()
    .min(1, 'Please select a blood test'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  consent: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the Privacy Policy and consent to data processing'),
});

export type BloodTestOrderFormData = z.infer<typeof bloodTestOrderSchema>;
