import { prisma } from '@/lib/prisma';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '../email-templates/result-ready-email';

export interface TestResult {
  id: string;
  status: TestStatus;
  resultUrl?: string | null;
  orderId: string;
  bloodTestId: string;
  createdAt: Date;
  updatedAt: Date;
  clientId?: string | null;
}

export async function getTestResultsByClientId(clientId: string): Promise<TestResult[]> {
  try {
    const results = await prisma.testResult.findMany({
      where: {
        clientId,
      },
      include: {
        bloodTest: {
          select: {
            name: true,
            slug: true,
          },
        },
        order: {
          select: {
            createdAt: true,
            testName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return results;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
}

export async function getTestResultById(resultId: string): Promise<TestResult | null> {
  try {
    const result = await prisma.testResult.findUnique({
      where: {
        id: resultId,
      },
      include: {
        bloodTest: {
          select: {
            name: true,
            slug: true,
          },
        },
        order: {
          select: {
            createdAt: true,
            testName: true,
          },
        },
      },
    });

    return result;
  } catch (error) {
    console.error(`Error fetching test result with ID ${resultId}:`, error);
    throw error;
  }
}

export async function updateTestResultStatus(
  resultId: string, 
  status: TestStatus,
  resultUrl?: string
): Promise<TestResult> {
  try {
    const updatedResult = await prisma.testResult.update({
      where: {
        id: resultId,
      },
      data: {
        status,
        ...(resultUrl && { resultUrl }),
      },
      include: {
        client: true,
        order: true,
        bloodTest: true,
      },
    });

    // If status is set to ready, send notification email
    if (status === TestStatus.ready && updatedResult.client?.email) {
      try {
        await sendResultReadyEmail({
          email: updatedResult.client.email,
          name: updatedResult.client.name,
          testName: updatedResult.bloodTest.name,
        });
        console.log(`Result ready email sent to ${updatedResult.client.email}`);
      } catch (emailError) {
        console.error('Error sending result ready email:', emailError);
        // Continue despite email error
      }
    }

    return updatedResult;
  } catch (error) {
    console.error(`Error updating test result status for ID ${resultId}:`, error);
    throw error;
  }
}

export async function createTestResult(
  orderId: string,
  bloodTestId: string,
  clientId?: string
): Promise<TestResult> {
  try {
    const newResult = await prisma.testResult.create({
      data: {
        status: TestStatus.processing,
        orderId,
        bloodTestId,
        clientId,
      },
    });

    return newResult;
  } catch (error) {
    console.error('Error creating test result:', error);
    throw error;
  }
}

export async function deleteTestResult(resultId: string): Promise<void> {
  try {
    await prisma.testResult.delete({
      where: {
        id: resultId,
      },
    });
  } catch (error) {
    console.error(`Error deleting test result with ID ${resultId}:`, error);
    throw error;
  }
}

export async function cleanupTestResults(): Promise<number> {
  try {
    // Delete test results that don't have a valid order or blood test
    const deletedResults = await prisma.testResult.deleteMany({
      where: {
        OR: [
          {
            order: null,
          },
          {
            bloodTest: null,
          },
        ],
      },
    });

    return deletedResults.count;
  } catch (error) {
    console.error('Error cleaning up test results:', error);
    throw error;
  }
}
