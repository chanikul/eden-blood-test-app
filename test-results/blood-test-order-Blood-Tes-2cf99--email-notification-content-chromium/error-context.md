# Test info

- Name: Blood Test Order Form >> verifies email notification content
- Location: C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:168:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('button[aria-haspopup="listbox"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('button[aria-haspopup="listbox"]')

    at C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:187:30
```

# Page snapshot

```yaml
- heading "Eden Clinic Blood Tests" [level=1]
- paragraph: Select your blood tests and book your appointment
- text: Full Name *
- textbox "Full Name *": Test User
- text: Email *
- textbox "Email *": test@example.com
- text: Date of Birth *
- textbox "Date of Birth *": 1980-12-31
- text: Mobile
- textbox "Mobile"
- text: Select a Blood Test *
- combobox "Select a blood test": Choose a test
- text: Notes / Comments
- textbox "Notes / Comments"
- button "Proceed to Payment"
- region "Notifications Alt+T"
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   87 |     
   88 |     // Select blood test
   89 |     await page.getByTestId('blood-test-select').click();
   90 |     await page.getByTestId('blood-test-option-well-man').click();
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
> 187 |     await expect(testSelect).toBeVisible();
      |                              ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  188 |     await testSelect.click();
  189 |     await page.click('text=Eden Well Man');
  190 |     await page.click('button[type="submit"]');
  191 |
  192 |     // Verify email request
  193 |     const emailData = JSON.parse(emailRequest.postData());
  194 |     expect(emailData.to).toBe('support@edenclinic.co.uk');
  195 |     expect(emailData.subject).toBe('New Blood Test Order');
  196 |     expect(emailData.text).toContain('Name: Test User');
  197 |     expect(emailData.text).toContain('Email: test@example.com');
  198 |     expect(emailData.text).toContain('DOB: 1980-12-31');
  199 |     expect(emailData.text).toContain('Selected Test: Eden Well Man');
  200 |     expect(emailData.text).toContain('Shipping address will be visible in Stripe.');
  201 |   });
  202 |
  203 |   test('meets accessibility requirements', async ({ page }) => {
  204 |     // Check form labels and ARIA attributes
  205 |     await expect(page.locator('label:has-text("Full Name")')).toBeVisible();
  206 |     await expect(page.locator('label:has-text("Email")')).toBeVisible();
  207 |     await expect(page.locator('label:has-text("Date of Birth")')).toBeVisible();
  208 |     await expect(page.locator('label:has-text("Mobile")')).toBeVisible();
  209 |     await expect(page.locator('label:has-text("Select a Blood Test")')).toBeVisible();
  210 |     await expect(page.locator('label:has-text("Notes")')).toBeVisible();
  211 |
  212 |     // Check required field indicators
  213 |     await expect(page.locator('text=*')).toHaveCount(4); // 4 required fields
  214 |
  215 |     // Check button states
  216 |     const submitButton = page.locator('button[type="submit"]');
  217 |     await expect(submitButton).toBeEnabled();
  218 |     
  219 |     // Submit empty form to trigger validation
  220 |     await submitButton.click();
  221 |     
  222 |     // Check error messages are announced to screen readers
  223 |     await expect(page.locator('[role="alert"]')).toHaveCount(4); // 4 validation errors
  224 |   });
  225 | });
  226 |
```