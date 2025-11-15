import { test, expect } from '@playwright/test';

/**
 * Test 1: App loads initial page
 * 
 * Goal: Verify that the app loads and renders the welcome screen without errors.
 */
test.describe('Test 1: App loads initial page', () => {
  test('should load and display welcome screen', async ({ page }) => {
    // Step 1: Open the app
    await page.goto('/');

    // Step 2: Wait for the initial screen to render
    await page.waitForLoadState('networkidle');

    // Expected 1-3: Welcome screen with hero text and Begin button
    await expect(page.locator('h1')).toContainText('Welcome to Aptum');
    await expect(page.locator('button', { hasText: 'Begin' })).toBeVisible();

    // Expected 4: No error screens or blocking dialogs
    const errorText = page.locator('text=/error|fail|crash/i');
    await expect(errorText).not.toBeVisible();

    // Expected 5: Check console for critical errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a moment to collect any console errors
    await page.waitForTimeout(1000);
    
    // Filter out known non-critical errors (if any)
    const criticalErrors = errors.filter(e => 
      !e.includes('Download the React DevTools') && 
      !e.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
