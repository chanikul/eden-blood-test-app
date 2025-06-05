import { prisma } from '../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-10) : 'not set');
    console.log('DIRECT_URL:', process.env.DIRECT_URL ? '***' + process.env.DIRECT_URL.slice(-10) : 'not set');
    
    // Test database connection
    try {
      console.log('Attempting database connection...');
      await prisma.$connect();
      console.log('Successfully connected to database');
    } catch (connError: any) {
      console.error('Database connection error:', {
        message: connError.message,
        code: connError.code,
        meta: connError.meta
      });
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: connError.message
      }, { status: 500 });
    }
    
    console.log('\n=== TESTING PRISMA QUERIES ===');
    
    try {
      // Test a simple query first
      console.log('Testing simple query...');
      const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Simple query result:', testQuery);
      
      // Get total count of all blood tests
      console.log('\nCounting all blood tests...');
      const totalCount = await prisma.bloodTest.count();
      console.log('Total blood tests (including inactive):', totalCount);
      
      // Get count of active blood tests
      console.log('\nCounting active blood tests...');
      const activeCount = await prisma.bloodTest.count({
        where: {
          isActive: true
        }
      });
      console.log('Active blood tests:', activeCount);
      
      // Get all blood tests with minimal fields
      console.log('\nFetching all blood tests...');
      const allTests = await prisma.bloodTest.findMany({
        select: {
          id: true,
          name: true,
          isActive: true
        }
      });
      
      console.log('\nBlood test status:');
      allTests.forEach(test => {
        console.log(`- ${test.name}: ${test.isActive ? 'active' : 'inactive'}`);
      });
      
      // Get blood tests for the response
      console.log('\nFetching blood tests...');
      const tests = await prisma.bloodTest.findMany({
        where: process.env.NODE_ENV === 'development' ? undefined : { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          slug: true,
          isActive: true,
          stripePriceId: true
        }
      });

      console.log(`Found ${tests.length} blood tests (${tests.filter(t => t.isActive).length} active)`);

      if (tests.length > 0) {
        console.log('First test:', tests[0]);
      }
      
      return NextResponse.json({ tests });
    } catch (queryError: any) {
      console.error('Database query error:', {
        message: queryError.message,
        code: queryError.code,
        meta: queryError.meta
      });
      return NextResponse.json({ 
        error: 'Database query failed',
        details: queryError.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching blood tests:', error);
    // More detailed error response
    return NextResponse.json(
      { error: 'Failed to fetch blood tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
