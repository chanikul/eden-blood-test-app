import { z } from 'zod';

export const bloodTestOrderSchema = z.object({
  patientName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  tests: z.array(z.string()).min(1, 'Please select at least one test'),
});

export type BloodTestOrderInput = z.infer<typeof bloodTestOrderSchema>;

export interface BloodTest {
  id: string;
  name: string;
  description?: string;
  price: number;
}

import { OrderStatus } from '@/types'
export { OrderStatus }
