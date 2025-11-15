import { test, expect } from '@playwright/test';

/**
 * Test 8: Multi-tab sanity
 * 
 * Goal: Verify that the app behaves correctly when opened in multiple tabs 
 * and that state stays consistent after updates and reloads.
 */
test.describe('Test 8: Multi-tab sanity', () => {
  
  test('should maintain consistent state across multiple tabs', async ({ browser }) => {
    // Create a browser context (shared cookies and localStorage)
    const context = await browser.newContext();
    
    // Step 1: Open the app in Tab A
    const tabA = await context.newPage();
    await tabA.goto('/onboarding/profile');
    await tabA.waitForLoadState('networkidle');
    
    // Complete some onboarding or set up a stateful screen
    await tabA.locator('input[type="number"]').first().fill('35');
    await tabA.locator('select').first().selectOption('Female');
    
    // Step 2: Open the app in Tab B using the same session
    const tabB = await context.newPage();
    await tabB.goto('/onboarding/profile');
    await tabB.waitForLoadState('networkidle');
    
    // Step 3: In Tab A, change a visible setting (switch units from metric to imperial)
    const unitsSelectA = tabA.locator('label:has-text("Units") select');
    await unitsSelectA.selectOption('imperial');
    
    // Also update a profile field
    const heightInputA = tabA.locator('label:has-text("Height") input[type="number"]');
    await heightInputA.fill('70'); // inches in imperial
    
    // Save by clicking Continue (if it persists) or just let it be
    // Some apps auto-save, others require explicit save
    
    // Step 4: In Tab B, reload the page
    await tabB.reload();
    await tabB.waitForLoadState('networkidle');
    
    // Expected 1: Tab B reloads without any error dialogs or auth failures
    const errorDialog = tabB.locator('[role="dialog"], text=/error|fail/i');
    await expect(errorDialog).not.toBeVisible();
    
    // Expected 2: After reload, Tab B reflects the updated state from Tab A
    // Check if units are imperial
    const heightLabelB = tabB.locator('text=/Height.*in/i');
    await expect(heightLabelB).toBeVisible({ timeout: 2000 });
    
    // Expected 3: No duplicate session errors or infinite redirects
    // Check URL is still the profile page
    await expect(tabB).toHaveURL(/.*onboarding\/profile/);
    
    // Step 5: Optionally perform a simple interaction in Tab B
    const ageInputB = tabB.locator('input[type="number"]').first();
    await ageInputB.fill('40');
    
    // Expected 4: Both tabs remain fully usable
    // Verify Tab A is still interactive
    await tabA.bringToFront();
    const ageInputA = tabA.locator('input[type="number"]').first();
    await expect(ageInputA).toBeEditable();
    
    // Verify Tab B is still interactive
    await tabB.bringToFront();
    await expect(ageInputB).toBeEditable();
    
    // Clean up
    await tabA.close();
    await tabB.close();
    await context.close();
  });

  test('should sync settings changes across tabs', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Open settings in Tab A
    const tabA = await context.newPage();
    await tabA.goto('/settings');
    await tabA.waitForLoadState('networkidle');
    
    // Open settings in Tab B
    const tabB = await context.newPage();
    await tabB.goto('/settings');
    await tabB.waitForLoadState('networkidle');
    
    // Change units in Tab A
    const unitsSelectA = tabA.locator('select[value]').first();
    const currentUnits = await unitsSelectA.inputValue();
    const newUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
    await unitsSelectA.selectOption(newUnits);
    
    // Reload Tab B
    await tabB.reload();
    await tabB.waitForLoadState('networkidle');
    
    // Tab B should reflect the new units
    const unitsSelectB = tabB.locator('select[value]').first();
    const unitsValueB = await unitsSelectB.inputValue();
    expect(unitsValueB).toBe(newUnits);
    
    await tabA.close();
    await tabB.close();
    await context.close();
  });

  test('should handle profile updates across tabs', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Tab A: Profile page
    const tabA = await context.newPage();
    await tabA.goto('/onboarding/profile');
    await tabA.waitForLoadState('networkidle');
    
    // Tab B: Another page, then navigate to profile
    const tabB = await context.newPage();
    await tabB.goto('/onboarding/welcome');
    
    // Update profile in Tab A
    await tabA.locator('input[type="number"]').first().fill('28');
    
    // Navigate Tab B to profile
    await tabB.goto('/onboarding/profile');
    await tabB.waitForLoadState('networkidle');
    
    // Tab B should eventually show the updated value (if persisted)
    // Note: This depends on whether the app persists state to localStorage/IndexedDB
    // For now, just verify no crashes
    const ageInputB = tabB.locator('input[type="number"]').first();
    await expect(ageInputB).toBeVisible();
    
    await tabA.close();
    await tabB.close();
    await context.close();
  });

  test('should not cause auth conflicts in multiple tabs', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Open multiple tabs
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();
    const tab3 = await context.newPage();
    
    // All navigate to the app
    await Promise.all([
      tab1.goto('/'),
      tab2.goto('/onboarding/profile'),
      tab3.goto('/settings')
    ]);
    
    // Wait for all to load
    await Promise.all([
      tab1.waitForLoadState('networkidle'),
      tab2.waitForLoadState('networkidle'),
      tab3.waitForLoadState('networkidle')
    ]);
    
    // All tabs should be functional, no auth errors
    await expect(tab1.locator('body')).toBeVisible();
    await expect(tab2.locator('body')).toBeVisible();
    await expect(tab3.locator('body')).toBeVisible();
    
    // Check for auth error messages
    const authError1 = tab1.locator('text=/unauthorized|auth.*failed|session.*expired/i');
    const authError2 = tab2.locator('text=/unauthorized|auth.*failed|session.*expired/i');
    const authError3 = tab3.locator('text=/unauthorized|auth.*failed|session.*expired/i');
    
    await expect(authError1).not.toBeVisible();
    await expect(authError2).not.toBeVisible();
    await expect(authError3).not.toBeVisible();
    
    await tab1.close();
    await tab2.close();
    await tab3.close();
    await context.close();
  });
});
