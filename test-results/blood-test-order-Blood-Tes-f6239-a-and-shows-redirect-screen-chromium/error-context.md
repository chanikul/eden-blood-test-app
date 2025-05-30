# Test info

- Name: Blood Test Order Form >> successfully submits form with valid data and shows redirect screen
- Location: C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:76:7

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('blood-test-option-well-man')

    at C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:90:58
```

# Page snapshot

```yaml
- region "Notifications Alt+T"
- listbox:
  - option "Advanced Thyroid Panel"
  - option "Eden Well Man"
  - option "Eden Well Man Plus"
  - option "Eden Well Woman"
  - option "TRT Review"
  - option "Ultimate Sporting Performance Blood Test"
  - option "Venous Testosterone Panel"
  - option "Weight Management Blood Test"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { mockBloodTests, setupMockApis } from './setup/test-utils';
   3 |
   4 | test.beforeAll(async ({ browser }) => {
   5 |   // Set up any global test configuration
   6 | });
   7 |
   8 | test.describe('Blood Test Order Form', () => {
   9 |   test.beforeAll(async ({ browser }) => {
   10 |     // Any global test setup
   11 |   });
   12 |
   13 |   test.beforeEach(async ({ page }) => {
   14 |     // Set up API mocks before navigation
   15 |     await setupMockApis(page);
   16 |     
   17 |     // Mock the blood tests data
   18 |     await page.route('**/api/blood-tests', async (route) => {
   19 |       await route.fulfill({
   20 |         status: 200,
   21 |         contentType: 'application/json',
   22 |         body: JSON.stringify({
   23 |           tests: mockBloodTests,
   24 |           success: true
   25 |         }),
   26 |       });
   27 |     });
   28 |
   29 |     // Navigate to the form page
   30 |     await page.goto('http://localhost:3000');
   31 |     
   32 |     // Wait for form and blood test data to be ready
   33 |     await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
   34 |     await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible', timeout: 10000 });
   35 |     await page.waitForTimeout(2000); // Wait for hydration
   36 |   });
   37 |   test.beforeEach(async ({ page }) => {
   38 |     // Start intercepting network requests
   39 |     await setupMockApis(page);
   40 |     
   41 |     // Navigate to the form page and wait for it to load
   42 |     await page.goto('http://localhost:3000');
   43 |     
   44 |     // Wait for the form and its key elements to be visible
   45 |     await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
   46 |     await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 5000 });
   47 |   });
   48 |
   49 |   test('shows validation errors for empty required fields', async ({ page }) => {
   50 |     // Wait for form to be interactive
   51 |     await page.waitForTimeout(2000); // Give time for React to hydrate
   52 |     await page.waitForLoadState('networkidle');
   53 |     await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible' });
   54 |     
   55 |     // Wait for form to be fully interactive
   56 |     await page.waitForTimeout(1000);
   57 |
   58 |     // Submit empty form
   59 |     const submitButton = page.locator('button[type="submit"]');
   60 |     await expect(submitButton).toBeVisible();
   61 |     await submitButton.click();
   62 |
   63 |     // Check for validation error messages
   64 |     await expect(page.getByTestId('fullName-error')).toBeVisible({ timeout: 5000 });
   65 |     await expect(page.getByTestId('email-error')).toBeVisible({ timeout: 5000 });
   66 |     await expect(page.getByTestId('dateOfBirth-error')).toBeVisible({ timeout: 5000 });
   67 |     await expect(page.getByTestId('testSlug-error')).toBeVisible({ timeout: 5000 });
   68 |
   69 |     // Verify error message content
   70 |     await expect(page.getByTestId('fullName-error')).toHaveText('Full name must be at least 2 characters');
   71 |     await expect(page.getByTestId('email-error')).toHaveText('Please enter a valid email address');
   72 |     await expect(page.getByTestId('dateOfBirth-error')).toHaveText('Please enter a valid date in YYYY-MM-DD format');
   73 |     await expect(page.getByTestId('testSlug-error')).toHaveText('Please select a blood test');
   74 |   });
   75 |
   76 |   test('successfully submits form with valid data and shows redirect screen', async ({ page }) => {
   77 |     // Wait for form to be interactive
   78 |     await page.waitForTimeout(2000); // Give time for React to hydrate
   79 |     await page.waitForLoadState('networkidle');
   80 |     await page.waitForSelector('[data-testid="blood-test-select"]', { state: 'visible' });
   81 |     
   82 |     // Fill in all required fields
   83 |     await page.getByTestId('fullName-input').fill('John Doe');
   84 |     await page.getByTestId('email-input').fill('john@example.com');
   85 |     await page.getByTestId('dateOfBirth-input').fill('1990-01-01');
   86 |     await page.getByTestId('mobile-input').fill('07700900000');
   87 |     
   88 |     // Select blood test
   89 |     await page.getByTestId('blood-test-select').click();
>  90 |     await page.getByTestId('blood-test-option-well-man').click();
      |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
   91 |     
   92 |     // Fill notes
   93 |     await page.locator('textarea[name="notes"]').fill('Test notes');
   94 |
   95 |     // Setup mock APIs
   96 |     await setupMockApis(page);
   97 |
   98 |     // Submit the form
   99 |     const submitButton = page.locator('button[type="submit"]');
  100 |     await expect(submitButton).toBeVisible();
  101 |     await submitButton.click();
  102 |
  103 |     // Check for redirect screen
  104 |     await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
  105 |     await expect(page.locator('text=Redirecting to payment...')).toBeVisible();
  106 |
  107 |     // Verify redirection screen
  108 |     await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
  109 |     await expect(page.locator('text=Redirecting to payment...')).toBeVisible();
  110 |   });
  111 |
  112 |   test('submits form without optional fields', async ({ page }) => {
  113 |     // Fill in only required fields
  114 |     await page.getByLabel('Full Name *').fill('Jane Smith');
  115 |     await page.getByLabel('Email *').fill('jane@example.com');
  116 |     await page.getByLabel('Date of Birth *').fill('1995-05-05');
  117 |     
  118 |     // Select blood test
  119 |     const testSelect = page.getByRole('combobox', { name: 'Select a Blood Test *' });
  120 |     await testSelect.click();
  121 |     await page.getByRole('option', { name: 'Eden Well Woman' }).click();
  122 |
  123 |     // Mock APIs are already set up in beforeEach
  124 |
  125 |     // Submit the form
  126 |     const submitButton = page.locator('button[type="submit"]');
  127 |     await expect(submitButton).toBeVisible();
  128 |     await submitButton.click();
  129 |
  130 |     // Check for redirect screen
  131 |     await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
  132 |
  133 |     // Verify redirection screen
  134 |     await expect(page.locator('text=Thanks! Your order has been received.')).toBeVisible();
  135 |   });
  136 |
  137 |   test('shows error message on API failure', async ({ page }) => {
  138 |     // Fill in the form
  139 |     await page.getByLabel('Full Name *').fill('John Doe');
  140 |     await page.getByLabel('Email *').fill('john@example.com');
  141 |     await page.getByLabel('Date of Birth *').fill('1990-01-01');
  142 |     
  143 |     // Select blood test
  144 |     const testSelect = page.getByRole('combobox', { name: 'Select a Blood Test *' });
  145 |     await testSelect.click();
  146 |     await page.getByRole('option', { name: 'Eden Well Man' }).click();
  147 |
  148 |     // Mock API error
  149 |     await page.route('**/api/order-blood-test', async (route) => {
  150 |       await route.fulfill({
  151 |         status: 500,
  152 |         body: JSON.stringify({
  153 |           success: false,
  154 |           message: 'Internal server error',
  155 |         }),
  156 |       });
  157 |     });
  158 |
  159 |     // Submit the form
  160 |     const submitButton = page.locator('button[type="submit"]');
  161 |     await expect(submitButton).toBeVisible();
  162 |     await submitButton.click();
  163 |
  164 |     // Check for error toast
  165 |     await expect(page.locator('text=Failed to submit blood test order')).toBeVisible();
  166 |   });
  167 |
  168 |   test('verifies email notification content', async ({ page, request }) => {
  169 |     // Email content will be verified through API request inspection
  170 |     let emailRequest: any;
  171 |     await page.route('/api/send-email', async (route) => {
  172 |       emailRequest = route.request();
  173 |       await route.fulfill({ status: 200 });
  174 |     });
  175 |
  176 |     // Fill and submit form
  177 |     const fullNameInput = page.locator('input[name="fullName"]');
  178 |     await expect(fullNameInput).toBeVisible();
  179 |     await fullNameInput.fill( 'Test User');
  180 |     const emailInput = page.locator('input[name="email"]');
  181 |     await expect(emailInput).toBeVisible();
  182 |     await emailInput.fill( 'test@example.com');
  183 |     const dobInput = page.locator('input[name="dateOfBirth"]');
  184 |     await expect(dobInput).toBeVisible();
  185 |     await dobInput.fill( '1980-12-31');
  186 |     const testSelect = page.locator('button[aria-haspopup="listbox"]');
  187 |     await expect(testSelect).toBeVisible();
  188 |     await testSelect.click();
  189 |     await page.click('text=Eden Well Man');
  190 |     await page.click('button[type="submit"]');
```