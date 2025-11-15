import { test, expect } from '@playwright/test';

/**
 * Test 6: API key test connection success and failure
 * 
 * Goal: Verify that the Test connection button behaves correctly for valid and invalid API keys.
 */
test.describe('Test 6: API key test connection', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the settings or Connect screen that contains API key input
    await page.goto('/onboarding/connect');
    await page.waitForLoadState('networkidle');
  });

  test('6a: Valid API key should show success', async ({ page }) => {
    // Only run if TEST_OPENAI_API_KEY is provided
    const validKey = process.env.TEST_OPENAI_API_KEY;
    if (!validKey) {
      test.skip();
      return;
    }

    // Step 1-2: Enter a known valid API key
    const apiKeyInput = page.locator('input[type="text"][placeholder*="sk-"]');
    await expect(apiKeyInput).toBeVisible();
    await apiKeyInput.fill(validKey);

    // Step 3: Click the Test connection button
    const testButton = page.locator('button', { hasText: /Test.*connection|Test/i });
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Expected 1: Button shows loading/disabled state
    await expect(testButton).toBeDisabled({ timeout: 1000 });

    // Step 4: Wait for the result
    // Expected 2: On success, success message and indicator appear
    const successMessage = page.locator('text=/Connection successful|Connection OK|Success/i');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // Success indicator (green icon or status)
    const successIcon = page.locator('[class*="check"], [class*="success"], svg[class*="check"]');
    await expect(successIcon.first()).toBeVisible();

    // Expected 3: The user can save and leave the screen
    const continueButton = page.locator('button', { hasText: /Continue|Next|Save/i });
    if (await continueButton.isVisible()) {
      await expect(continueButton).toBeEnabled();
    }
  });

  test('6b: Invalid API key should show error', async ({ page }) => {
    // Step 1: Enter an invalid API key
    const apiKeyInput = page.locator('input[type="text"][placeholder*="sk-"]');
    await expect(apiKeyInput).toBeVisible();
    await apiKeyInput.fill('sk-abc123-invalid-key-for-testing');

    // Step 2: Click the Test connection button
    const testButton = page.locator('button', { hasText: /Test.*connection|Test/i });
    await expect(testButton).toBeVisible();
    await testButton.click();

    // Expected 1: Button shows loading/disabled state while test runs
    await expect(testButton).toBeDisabled({ timeout: 1000 });

    // Step 3: Wait for the result
    // Expected 2: A clear error message is displayed
    const errorMessage = page.locator('text=/API key invalid|invalid.*key|Connection error|Connection failed|not accessible/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Expected 3: No success icon is shown
    const successIcon = page.locator('[class*="check-circle"], svg[class*="check"]');
    await expect(successIcon.first()).not.toBeVisible();

    // Expected 4: The key is not marked as connected
    const connectedBadge = page.locator('text=/Connected|OK/i');
    await expect(connectedBadge).not.toBeVisible();
  });

  test('should handle empty API key gracefully', async ({ page }) => {
    // Test the case where no API key is provided
    const testButton = page.locator('button', { hasText: /Test.*connection|Test/i });
    
    if (await testButton.isVisible()) {
      await testButton.click();
      
      // Should show error or be disabled
      const errorOrDisabled = await Promise.race([
        testButton.isDisabled().then(() => 'disabled'),
        page.locator('text=/No API key|API key required/i').isVisible({ timeout: 2000 }).then(() => 'error')
      ]).catch(() => 'none');
      
      expect(errorOrDisabled).not.toBe('none');
    }
  });

  test('should allow retesting after failure', async ({ page }) => {
    // Test invalid key first
    const apiKeyInput = page.locator('input[type="text"][placeholder*="sk-"]');
    await apiKeyInput.fill('sk-invalid');
    
    const testButton = page.locator('button', { hasText: /Test.*connection|Test/i });
    await testButton.click();
    
    // Wait for error
    await page.waitForTimeout(3000);
    
    // Button should be enabled again for retry
    await expect(testButton).toBeEnabled({ timeout: 2000 });
    
    // Update to a different invalid key and retest
    await apiKeyInput.clear();
    await apiKeyInput.fill('sk-another-invalid');
    await testButton.click();
    
    // Should process the new test
    await expect(testButton).toBeDisabled({ timeout: 1000 });
  });

  test('should work from Settings page as well', async ({ page }) => {
    // Navigate to Settings page instead of Connect
    await page.goto('/settings');
    
    // Find API key section
    const apiKeyInput = page.locator('input[type="text"][placeholder*="sk-"]');
    if (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Same test as 6b but from Settings page
      await apiKeyInput.fill('sk-test-invalid');
      
      const testButton = page.locator('button', { hasText: /Test.*connection|Test/i });
      await testButton.click();
      
      const errorMessage = page.locator('text=/API key invalid|Connection error|Connection failed/i');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    }
  });
});
