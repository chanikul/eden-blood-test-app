import { Page } from '@playwright/test';

export interface BloodTest {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const mockBloodTests: BloodTest[] = [
  // Mock blood test data that matches the Prisma schema

  {
    id: '1',
    name: 'Eden Well Man',
    slug: 'well-man',
    price: 199,
    description: 'Comprehensive blood test for men',
  },
  {
    id: '2',
    name: 'Eden Well Woman',
    slug: 'well-woman',
    price: 199,
    description: 'Comprehensive blood test for women',
  },
];

export async function setupMockApis(page: Page) {
  // No need to mock blood tests API as we're mocking Prisma directly

  // Mock order creation API
  await page.route('**/api/order-blood-test', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'POST') {
      const body = JSON.parse(await request.postData() || '{}');
      
      // Validate required fields
      if (!body.fullName || !body.email || !body.dateOfBirth || !body.testSlug) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Missing required fields',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'test-order-123',
          paymentUrl: 'https://stripe.com/test-payment',
        }),
      });
    } else {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      });
    }
  });

  // Mock email service API
  await page.route('**/api/send-email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock payment link API
  await page.route('**/api/payment-link', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://stripe.com/test-payment',
      }),
    });
  });
}
