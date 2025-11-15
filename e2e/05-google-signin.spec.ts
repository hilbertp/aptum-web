import { test, expect } from '@playwright/test';

/**
 * Test 5: Google sign in with test user
 * 
 * Goal: Verify that Google sign in works end to end for the test user.
 * Test account: hilbertp@gmail.com
 * 
 * NOTE: For fully automated tests, two-factor auth must be disabled or the provider must be mocked.
 * This test will attempt the real flow but may need to be skipped in CI if 2FA is active.
 */
test.describe('Test 5: Google sign in', () => {
  
  test.skip('should complete Google sign-in flow for test user', async ({ page, context }) => {
    // This test is skipped by default as it requires:
    // 1. Real Google credentials (hilbertp@gmail.com + password)
    // 2. Two-factor auth disabled on the account
    // 3. Or a mocked Google OAuth provider
    
    // Step 1: From a logged out state, navigate to the Connect page
    await page.goto('/onboarding/connect');
    
    // Step 2: Click the Sign in with Google button
    const signInButton = page.locator('button', { hasText: /Sign in with Google|Google/i });
    await expect(signInButton).toBeVisible();
    
    // Setup listener for popup window
    const popupPromise = context.waitForEvent('page');
    await signInButton.click();
    const popup = await popupPromise;
    
    // Step 3: In the Google login dialog, enter the email
    await popup.waitForLoadState();
    const emailInput = popup.locator('input[type="email"]');
    await emailInput.fill('hilbertp@gmail.com');
    await popup.locator('button', { hasText: 'Next' }).click();
    
    // Step 4: Enter the test password
    const passwordInput = popup.locator('input[type="password"]');
    await passwordInput.fill(process.env.TEST_USER_PASSWORD || '');
    await popup.locator('button', { hasText: 'Next' }).click();
    
    // Step 5: Confirm any Google consent screen that appears
    const consentButton = popup.locator('button', { hasText: /Continue|Allow|Accept/i });
    if (await consentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consentButton.click();
    }
    
    // Step 6: Wait for the redirect to complete and return to the app
    await page.waitForURL(/.*/, { timeout: 10000 });
    
    // Expected 2: The app registers the user as signed in
    // Check for user indicator (email or name visible)
    const userIndicator = page.locator('text=/hilbertp@gmail.com|signed in/i');
    await expect(userIndicator).toBeVisible({ timeout: 5000 });
    
    // Expected 3: The app does not get stuck in a loading state
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"]');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('should show sign-in button on Connect page', async ({ page }) => {
    // Basic test to verify the sign-in UI is present
    await page.goto('/onboarding/connect');
    
    const signInButton = page.locator('button', { hasText: /Sign in with Google|Google/i });
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toBeEnabled();
  });

  test('should handle sign-in state persistence', async ({ page }) => {
    // Test that auth state is maintained across page reloads
    // This assumes the user is already signed in from a previous session
    
    await page.goto('/onboarding/connect');
    
    // Check if there's a signed-in indicator
    const signedInIndicator = page.locator('text=/signed in|connected/i');
    
    if (await signedInIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      // User is signed in, reload and verify state persists
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still show signed-in state
      await expect(signedInIndicator).toBeVisible();
    }
  });
});
