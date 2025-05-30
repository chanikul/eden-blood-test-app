import { prisma } from '@/lib/prisma';
import { generateSecurePassword, hashPassword } from '@/lib/utils/password';
import { extractFirstName, extractLastName } from '@/lib/utils/name';
import { generateWelcomeEmail } from '@/lib/email-templates/welcome';
import { sendEmail } from '@/lib/services/email';
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
    console.log('🔑 [AUTH 1/3] Hashing password for new account...');
    // Hash the provided password
    const hashedPassword = await hashPassword(params.password);
    
    console.log('🔑 [AUTH 2/3] Creating Supabase Auth user with admin client...');
    console.log('Supabase Auth parameters:', {
      email: params.email,
      passwordProvided: !!params.password,
      email_confirm: true
    });
    
    // Create Supabase auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ [AUTH] Supabase auth user creation failed:', authError);
      throw new Error(`Failed to create Supabase auth user: ${authError?.message}`);
    }
    
    if (!authUser.user) {
      console.error('❌ [AUTH] Supabase auth returned success but no user object');
      throw new Error('Supabase auth returned success but no user object');
    }
    
    console.log('✅ [AUTH 2/3] Supabase Auth user created successfully:', {
      id: authUser.user.id,
      email: authUser.user.email,
      createdAt: authUser.user.created_at
    });

    // Extract first and last name
    const firstName = extractFirstName(params.name);
    const lastName = extractLastName(params.name);
    
    // Create client user account in database
    console.log('💾 [AUTH 3/3] Creating ClientUser database record linked to Supabase auth ID...');
    console.log('ClientUser data:', {
      id: authUser.user.id, // Using Supabase ID for consistent auth
      email: params.email,
      name: params.name,
      dateOfBirth: params.dateOfBirth,
      hasPassword: !!params.password,
      hasAddress: !!params.address
    });
    
    let client;
    try {
      client = await prisma.clientUser.create({
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
      
      console.log('✅ [AUTH 3/3] Database ClientUser created successfully:', {
        clientId: client.id, 
        email: client.email,
        createdAt: client.createdAt
      });
      
      console.log('💾 [DATABASE] ClientUser database record created with details:', {
        id: client.id,
        email: client.email,
        name: client.name,
        dateOfBirth: client.dateOfBirth,
        mobile: client.mobile,
        active: client.active,
        resetToken: client.resetToken,
        resetTokenExpires: client.resetTokenExpires,
      });
      
      if (params.address) {
        console.log('✅ [ADDRESS] Shipping address created and linked to user with details:', {
          type: 'SHIPPING',
          name: params.name,
          line1: params.address.line1,
          line2: params.address.line2,
          city: params.address.city,
          postcode: params.address.postalCode,
          country: params.address.country,
          isDefault: true
        });
      } else {
        console.log('⚠️ [ADDRESS] No shipping address provided, skipped address creation');
      }
      
      return client;
    } catch (dbError) {
      console.error('❌ [AUTH 3/3] Error creating database user:', dbError);
      throw dbError;
    }

    // Create order records if provided
    if (params.orders?.length) {
      console.log('📌 [ORDERS] Linking existing orders to the new user account...');
      
      const orderIds = params.orders.map(order => order.id);
      console.log('Order IDs to link:', orderIds);
      
      try {
        const result = await prisma.order.updateMany({
          where: {
            id: {
              in: orderIds
            }
          },
          data: {
            clientId: client.id
          }
        });
        
        console.log('✅ [ORDERS] Successfully linked orders to user account:', {
          updatedCount: result.count,
          orderIds,
          userId: client.id
        });
      } catch (orderLinkError) {
        console.error('⚠️ [ORDERS] Error linking orders to user account:', orderLinkError);
        // Continue despite order linking error - don't fail the whole process
      }
    }
    

    
    // Send welcome email with first order details using the styled template
    if (params.orders?.[0]) {
      try {
        console.log('📧 [EMAIL 3/3] Generating welcome email with styled template...');
        const { subject, html } = await generateWelcomeEmail({
          name: params.name,
          email: params.email,
          password: params.password,
          order: {
            id: params.orders[0].id,
            patientName: params.name,
            patientEmail: params.email,
            bloodTest: {
              name: params.orders[0].testName
            }
          }
        });
        
        console.log('📧 [EMAIL 3/3] Styled welcome email generated, sending to:', params.email);
        await sendEmail({
          to: params.email,
          subject,
          text: `Welcome to Eden Clinic! Your account has been created. Email: ${params.email}, Password: ${params.password}`,
          html,
        });
        
        console.log('✅ [EMAIL 3/3] Welcome email sent successfully to:', params.email);
      } catch (emailError) {
        console.error('❌ [EMAIL 3/3] Error sending welcome email:', emailError);
        // Don't fail the entire account creation process if email sending fails
      }
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
