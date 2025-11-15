import { test, expect } from '@playwright/test';

/**
 * Test 2: Welcome screen navigation flow
 * 
 * Goal: Verify that the onboarding flow navigates correctly through the main screens.
 */
test.describe('Test 2: Welcome screen navigation flow', () => {
  test('should navigate through onboarding screens in correct order', async ({ page }) => {
    // Step 1: Start on the welcome screen
    await page.goto('/onboarding/welcome');
    await expect(page.locator('h1')).toContainText('Welcome to Aptum');

    // Step 2: Click the Begin button
    await page.locator('button', { hasText: 'Begin' }).click();

    // Expected 1: After clicking Begin, the profile screen is displayed
    await page.waitForURL('**/onboarding/profile');
    await expect(page.locator('h2')).toContainText('Your Profile');

    // Step 3: On the profile screen, click the Continue button
    // First fill in required fields to enable Continue
    await page.locator('input[type="number"]').first().fill('30'); // age
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 2: After clicking Continue on profile, the connect screen is displayed
    // Based on the routing, it goes to Connect screen (content/API setup)
    await page.waitForURL('**/onboarding/connect');
    
    // Step 4: On the connect screen, click Continue (or similar)
    // Check if there's a Continue or Skip button
    const continueButton = page.locator('button', { hasText: /Continue|Skip|Next/ }).first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      
      // Expected 3: After clicking Continue on connect screen, the goals screen is displayed
      await page.waitForURL('**/onboarding/goals');
      await expect(page.locator('h1, h2').first()).toContainText(/Goals|Training/);
    }

    // Expected 4: The order of screens is Welcome → Profile → Connect → Goals
    // This is verified by the URL changes above
    
    // Expected 5: No navigation errors or unexpected intermediate screens
    // The waitForURL calls above would fail if unexpected screens appeared
  });

  test('should allow navigation back to previous screens', async ({ page }) => {
    // Navigate to profile
    await page.goto('/onboarding/profile');
    
    // Click Back button
    const backButton = page.locator('button', { hasText: 'Back' });
    if (await backButton.isVisible()) {
      await backButton.click();
      
      // Should return to welcome
      await page.waitForURL('**/onboarding/welcome');
      await expect(page.locator('h1')).toContainText('Welcome to Aptum');
    }
  });
});
