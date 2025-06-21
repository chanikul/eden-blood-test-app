import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPatientFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSupabaseClient } from '@/lib/supabase-client';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    // Force revalidation of cookies on each request
    const cookieStore = cookies();
    console.log('Profile data API - Available cookies:', cookieStore.getAll().map(c => c.name));
    
    // Check for patient token
    const patientToken = cookieStore.get('eden_patient_token');
    console.log('Profile data API - Patient token exists:', !!patientToken);
    
    if (!patientToken) {
      return NextResponse.json(
        { isLoggedIn: false, hasProfileData: false },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } 
        }
      );
    }
    
    // Double-check with Supabase directly to ensure we have the latest session state
    let supabaseSessionValid = false;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      
      console.log('Profile data API - Supabase session check:', { 
        hasSession: !!data.session, 
        error: error?.message || null,
        user: data.session?.user?.email || null
      });
      
      supabaseSessionValid = !!data.session;
    } catch (error) {
      console.error('Profile data API - Error checking Supabase session:', error);
    }
    
    // Even if Supabase session is not valid, we can still proceed if we have a valid patient token
    // This handles the case where Supabase session might be expired but our custom token is still valid
    console.log('Profile data API - Proceeding with patient token validation');
    
    // We'll let getPatientFromToken determine if the user is actually logged in
    // It will verify our custom token and return null if invalid
    
    console.log('Profile data API - Checking patient from token');
    // Get patient from token
    const patient = await getPatientFromToken();
    console.log('Profile data API - Patient from token result:', patient);
    
    if (!patient) {
      return NextResponse.json(
        { isLoggedIn: false, hasProfileData: false },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } 
        }
      );
    }
    
    // Check if patient has required profile data
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: patient.id },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        active: true
      }
    });
    
    // Check if client user exists and is active
    if (!clientUser || !clientUser.active) {
      console.log('Profile data API - Patient not found or inactive:', { 
        found: !!clientUser, 
        active: clientUser?.active 
      });
      return NextResponse.json(
        { isLoggedIn: false, hasProfileData: false },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } 
        }
      );
    }
    
    const hasRequiredFields = 
      clientUser.name && 
      clientUser.email && 
      clientUser.dateOfBirth;
    
    return NextResponse.json(
      { 
        isLoggedIn: true, 
        hasProfileData: !!hasRequiredFields,
        ...clientUser, // Return the full client user object
        id: clientUser.id // Ensure id is included
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error('Profile data API - Unexpected error:', error);
    return NextResponse.json(
      { isLoggedIn: false, hasProfileData: false, error: 'Server error' },
      { 
        status: 200, // Still return 200 to avoid breaking client flow
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  }
}
