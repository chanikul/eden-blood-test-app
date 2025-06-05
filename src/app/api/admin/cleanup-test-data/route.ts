import { prisma } from '../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { stripe } from '../../../../lib/stripe';
import { deleteFile, listFiles } from '../../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Disabled for production - this feature is no longer available
  return NextResponse.json(
    { error: 'This feature has been disabled for production use' },
    { status: 403 }
  );
  try {
    const session = await getSession();
    
    // Only admins can perform cleanup operations
    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Step 1: Get all active Stripe products with type: blood_test
    const stripeProducts = await stripe.products.list({
      limit: 100,
      active: true,
    });
    
    const validProductIds = stripeProducts.data
      .filter(product => product.metadata?.type === 'blood_test')
      .map(product => product.id);
    
    console.log(`Found ${validProductIds.length} valid Stripe blood test products`);
    
    // Step 2: Delete test results that don't have a valid blood test
    const deletedTestResults = await prisma.testResult.deleteMany({
      where: {
        bloodTest: {
          stripeProductId: {
            notIn: validProductIds,
          },
        },
      },
    });
    
    console.log(`Deleted ${deletedTestResults.count} invalid test results`);
    
    // Step 3: Update all test results to use the new status system
    const updatedTestResults = await prisma.testResult.updateMany({
      where: {
        OR: [
          { status: { equals: 'WAITING' as any } },
          { status: { equals: 'IN_PROGRESS' as any } }
        ]
      },
      data: {
        status: 'processing',
      },
    });
    
    console.log(`Updated ${updatedTestResults.count} test results to 'processing' status`);
    
    // Step 4: Update any READY status to 'ready'
    const updatedReadyResults = await prisma.testResult.updateMany({
      where: {
        status: { equals: 'READY' as any },
      },
      data: {
        status: 'ready',
      },
    });
    
    console.log(`Updated ${updatedReadyResults.count} test results from 'READY' to 'ready' status`);
    
    // Step 5: Delete blood tests that don't match current Stripe products
    const deletedBloodTests = await prisma.bloodTest.deleteMany({
      where: {
        stripeProductId: {
          notIn: validProductIds,
        },
      },
    });
    
    console.log(`Deleted ${deletedBloodTests.count} invalid blood tests`);
    
    // Step 6: Clean up orphaned files in storage
    let deletedFiles = 0;
    try {
      // Get all test results with resultUrl
      const testResultsWithFiles = await prisma.testResult.findMany({
        select: {
          resultUrl: true,
        },
        where: {
          resultUrl: {
            not: null,
          },
        },
      });
      
      // Extract valid file paths from URLs
      const validFilePaths = testResultsWithFiles
        .map(result => {
          if (!result.resultUrl) return null;
          try {
            const url = new URL(result.resultUrl);
            const path = url.pathname.split('/').slice(-2).join('/');
            return path.startsWith('/') ? path.substring(1) : path;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as string[];
      
      // List all files in the test-results storage bucket
      const allFiles = await listFiles('test-results');
      
      // Find orphaned files (files in storage that don't belong to any test result)
      const orphanedFiles = allFiles.filter(file => {
        return !validFilePaths.some(validPath => file.includes(validPath));
      });
      
      // Delete orphaned files
      for (const file of orphanedFiles) {
        await deleteFile('test-results', file);
        deletedFiles++;
      }
      
      console.log(`Deleted ${deletedFiles} orphaned files from storage`);
    } catch (storageError) {
      console.error('Error cleaning up storage files:', storageError);
      // Continue with the response even if storage cleanup fails
    }
    
    return NextResponse.json({
      success: true,
      deletedTestResults: deletedTestResults.count,
      updatedTestStatuses: updatedTestResults.count + updatedReadyResults.count,
      syncedWithStripe: validProductIds.length,
      deletedFiles,
    });
  } catch (error: unknown) {
    console.error('Error cleaning up test data:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to clean up test data', details: errorMessage },
      { status: 500 }
    );
  }
}
