import { prisma } from '@/lib/prisma';
import { generateSecurePassword, hashPassword } from '@/lib/utils/password';
import { extractFirstName, extractLastName } from '@/lib/utils/name';
import { sendWelcomeEmail } from '@/lib/services/email';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface PatientAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PatientOrder {
  id: string;
  testName: string;
  status: string;
  createdAt: Date;
}

interface CreatePatientAccountParams {
  name: string;
  email: string;
  dateOfBirth: string;
  password: string;
  mobile?: string | null;
  address?: PatientAddress;
  orders?: PatientOrder[];
}

export async function createPatientAccount(params: CreatePatientAccountParams) {
  try {
    // Hash the provided password
    const hashedPassword = await hashPassword(params.password);
    
    // Create Supabase auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create Supabase auth user: ${authError?.message}`);
    }

    // Extract first and last name
    const firstName = extractFirstName(params.name);
    const lastName = extractLastName(params.name);
    
    // Create client user account
    const client = await prisma.clientUser.create({
      data: {
        id: authUser.user.id, // Use Supabase user ID
        email: params.email,
        passwordHash: hashedPassword,
        name: params.name,
        dateOfBirth: params.dateOfBirth,
        mobile: params.mobile,
        active: true,
        resetToken: generateSecurePassword(), // Temporary password reset token
        resetTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        addresses: params.address ? {
          create: {
            type: 'SHIPPING',
            name: params.name,
            line1: params.address.line1,
            line2: params.address.line2,
            city: params.address.city,
            postcode: params.address.postalCode,
            country: params.address.country,
            isDefault: true
          }
        } : undefined
      }
    });

    // Create order records if provided
    if (params.orders?.length) {
      await prisma.order.updateMany({
        where: {
          id: {
            in: params.orders.map(order => order.id)
          }
        },
        data: {
          clientId: client.id
        }
      });
    }
    

    
    // Send welcome email with first order details
    if (params.orders?.[0]) {
      await sendWelcomeEmail({
        email: params.email,
        name: params.name,
        password: params.password,
        orderId: params.orders[0].id,
        testName: params.orders[0].testName
      });
    }
    
    console.log('✅ Patient account created successfully:', {
      email: params.email,
      clientId: client.id,
      orderId: params.orders?.[0]?.id
    });
    
    return client;
  } catch (error) {
    console.error('❌ Error creating patient account:', error);
    throw error;
  }
}
