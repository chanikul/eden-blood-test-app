# Test info

- Name: Blood Test Order Form >> meets accessibility requirements
- Location: C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:203:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveCount(expected)

Locator: locator('[role="alert"]')
Expected: 4
Received: 1
Call log:
  - expect.toHaveCount with timeout 5000ms
  - waiting for locator('[role="alert"]')
    8 × locator resolved to 1 element
      - unexpected value "1"

    at C:\Users\chani\CascadeProjects\eden-clinic\tests\blood-test-order.spec.ts:223:50
```

# Page snapshot

```yaml
- heading "Eden Clinic Blood Tests" [level=1]
- paragraph: Select your blood tests and book your appointment
- text: Full Name *
- textbox "Full Name *"
- text: Full name must be at least 2 characters Email *
- textbox "Email *"
- text: Please enter a valid email address Date of Birth *
- textbox "Date of Birth *"
- text: Please enter a valid date in YYYY-MM-DD format Mobile
- textbox "Mobile"
- text: Please enter a valid phone number Select a Blood Test *
- combobox "Select a blood test": Choose a test
- text: Required Notes / Comments
- textbox "Notes / Comments"
- button "Proceed to Payment"
- region "Notifications Alt+T"
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
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
> 223 |     await expect(page.locator('[role="alert"]')).toHaveCount(4); // 4 validation errors
      |                                                  ^ Error: Timed out 5000ms waiting for expect(locator).toHaveCount(expected)
  224 |   });
  225 | });
  226 |
```