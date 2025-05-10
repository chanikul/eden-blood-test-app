import { test, expect } from '@playwright/test';
import { mockBloodTests, setupMockApis } from './setup/test-utils';

test.beforeAll(async ({ browser }) => {
  // Set up any global test configuration
});

test.describe('Blood Test Order Form', () => {
  test.beforeAll(async ({ browser }) => {
    // Any global test setup
  });

  test.beforeEach(async ({ page }) => {
    // Set up API mocks before navigation
    await setupMockApis(page);
    
    // Mock the blood tests data
    await page.route('**/api/blood-tests', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tests: mockBloodTests,
          success: true
        }),
      });
    });

    // Navigate to the form page
    await page.goto('http://localhost:3000');
    
    // Wait for form and blood test data to be ready
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for hydration
  });
  test.beforeEach(async ({ page }) => {
    // Start intercepting network requests
    await setupMockApis(page);
    
    // Navigate to the form page and wait for it to load
    await page.goto('http://localhost:3000');
    
    // Wait for the form and its key elements to be visible
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 5000 });
  });

  test('shows validation errors for empty required fields', async ({ page }) => {
    // Wait for form to be interactive
    await page.waitForTimeout(2000); // Give time for React to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible' });
    
    // Wait for form to be fully interactive
    await page.waitForTimeout(1000);

    // Submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Check for validation error messages
    await expect(page.getByTestId('fullName-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('email-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('dateOfBirth-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('testSlug-error')).toBeVisible({ timeout: 5000 });

    // Verify error message content
    await expect(page.getByTestId('fullName-error')).toHaveText('Full name must be at least 2 characters');
    await expect(page.getByTestId('email-error')).toHaveText('Please enter a valid email address');
    await expect(page.getByTestId('dateOfBirth-error')).toHaveText('Please enter a valid date in YYYY-MM-DD format');
    await expect(page.getByTestId('testSlug-error')).toHaveText('Please select a blood test');
  });

  test('successfully submits form with valid data and shows redirect screen', async ({ page }) => {
    // Wait for form to be interactive
    await page.waitForTimeout(2000); // Give time for React to hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible' });
    
    // Fill in all required fields
    await page.getByTestId('fullName-input').fill('John Doe');
    await page.getByTestId('email-input').fill('john@example.com');
    await page.getByTestId('dateOfBirth-input').fill('1990-01-01');
    await page.getByTestId('mobile-input').fill('07700900000');
    
    // Select blood test
    await page.getByTestId('blood-test-select').click();
    await page.getByTestId('blood-test-option-well-man').click();
    
    // Fill notes
    await page.locator('textarea[name="notes"]').fill('Test notes');

    // Setup mock APIs
    await setupMockApis(page);

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Check for redirect screen
    await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
    await expect(page.locator('text=Redirecting to payment...')).toBeVisible();

    // Verify redirection screen
    await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
    await expect(page.locator('text=Redirecting to payment...')).toBeVisible();
  });

  test('submits form without optional fields', async ({ page }) => {
    // Fill in only required fields
    await page.getByLabel('Full Name *').fill('Jane Smith');
    await page.getByLabel('Email *').fill('jane@example.com');
    await page.getByLabel('Date of Birth *').fill('1995-05-05');
    
    // Select blood test
    const testSelect = page.getByRole('combobox', { name: 'Select a Blood Test *' });
    await testSelect.click();
    await page.getByRole('option', { name: 'Eden Well Woman' }).click();

    // Mock APIs are already set up in beforeEach

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Check for redirect screen
    await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();

    // Verify redirection screen
    await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
  });

  test('shows error message on API failure', async ({ page }) => {
    // Fill in the form
    await page.getByLabel('Full Name *').fill('John Doe');
    await page.getByLabel('Email *').fill('john@example.com');
    await page.getByLabel('Date of Birth *').fill('1990-01-01');
    
    // Select blood test
    const testSelect = page.getByRole('combobox', { name: 'Select a Blood Test *' });
    await testSelect.click();
    await page.getByRole('option', { name: 'Eden Well Man' }).click();

    // Mock API error
    await page.route('**/api/order-blood-test', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
        }),
      });
    });

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Check for error toast
    await expect(page.locator('text=Failed to submit blood test order')).toBeVisible();
  });

  test('verifies email notification content', async ({ page, request }) => {
    // Email content will be verified through API request inspection
    let emailRequest: any;
    await page.route('/api/send-email', async (route) => {
      emailRequest = route.request();
      await route.fulfill({ status: 200 });
    });

    // Fill and submit form
    const fullNameInput = page.locator('input[name="fullName"]');
    await expect(fullNameInput).toBeVisible();
    await fullNameInput.fill( 'Test User');
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill( 'test@example.com');
    const dobInput = page.locator('input[name="dateOfBirth"]');
    await expect(dobInput).toBeVisible();
    await dobInput.fill( '1980-12-31');
    const testSelect = page.locator('button[aria-haspopup="listbox"]');
    await expect(testSelect).toBeVisible();
    await testSelect.click();
    await page.click('text=Eden Well Man');
    await page.click('button[type="submit"]');

    // Verify email request
    const emailData = JSON.parse(emailRequest.postData());
    expect(emailData.to).toBe('support@edenclinic.co.uk');
    expect(emailData.subject).toBe('New Blood Test Order');
    expect(emailData.text).toContain('Name: Test User');
    expect(emailData.text).toContain('Email: test@example.com');
    expect(emailData.text).toContain('DOB: 1980-12-31');
    expect(emailData.text).toContain('Selected Test: Eden Well Man');
    expect(emailData.text).toContain('Shipping address will be visible in Stripe.');
  });

  test('meets accessibility requirements', async ({ page }) => {
    // Check form labels and ARIA attributes
    await expect(page.locator('label:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Date of Birth")')).toBeVisible();
    await expect(page.locator('label:has-text("Mobile")')).toBeVisible();
    await expect(page.locator('label:has-text("Select a Blood Test")')).toBeVisible();
    await expect(page.locator('label:has-text("Notes")')).toBeVisible();

    // Check required field indicators
    await expect(page.locator('text=*')).toHaveCount(4); // 4 required fields

    // Check button states
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    
    // Submit empty form to trigger validation
    await submitButton.click();
    
    // Check error messages are announced to screen readers
    await expect(page.locator('[role="alert"]')).toHaveCount(4); // 4 validation errors
  });
});
