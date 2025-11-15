import { test, expect } from '@playwright/test';

/**
 * Test 4: Profile screen validation unhappy paths
 * 
 * Goal: Verify that invalid height, weight, and age values trigger clear validation errors and block progress.
 */
test.describe('Test 4: Profile screen validation unhappy paths', () => {
  
  /**
   * Helper function to fill valid profile data except for the field being tested
   */
  async function fillValidProfile(page: any, skipField?: string) {
    if (skipField !== 'age') {
      await page.locator('input[type="number"]').first().fill('30');
    }
    if (skipField !== 'gender') {
      await page.locator('select').first().selectOption('Male');
    }
    if (skipField !== 'height') {
      await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    }
    if (skipField !== 'weight') {
      await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    }
    if (skipField !== 'lifting') {
      const liftingSelect = page.locator('select', { has: page.locator('option[value="novice"]') });
      await liftingSelect.selectOption('novice');
    }
    if (skipField !== 'fitness') {
      const fitnessSelect = page.locator('select', { has: page.locator('option[value="beginner"]') });
      await fitnessSelect.selectOption('beginner');
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding/profile');
    // Ensure metric units for consistent validation
    const unitsSelect = page.locator('label:has-text("Units") select');
    await unitsSelect.selectOption('metric');
  });

  test('4a: Height below minimum should show validation error', async ({ page }) => {
    // Step 1-2: Enter height 49 centimeters
    const heightInput = page.locator('label:has-text("Height") input[type="number"]');
    await heightInput.fill('49');

    // Step 3: Fill all other required fields with valid values
    await fillValidProfile(page, 'height');

    // Step 4: Click Continue
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: A height validation error appears stating minimum height
    // Check for validation error message
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /height|minimum|50/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation to the next screen is blocked
    // Should still be on profile page
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);

    // Expected 3: All other fields are unchanged
    expect(await page.locator('input[type="number"]').first().inputValue()).toBe('30'); // age
  });

  test('4b: Height above maximum should show validation error', async ({ page }) => {
    const heightInput = page.locator('label:has-text("Height") input[type="number"]');
    await heightInput.fill('251');
    await fillValidProfile(page, 'height');
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: Height validation error with valid range
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /height|maximum|250|range/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation is blocked
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);
  });

  test('4c: Weight below minimum should show validation error', async ({ page }) => {
    const weightInput = page.locator('label:has-text("Weight") input[type="number"]');
    await weightInput.fill('24');
    await fillValidProfile(page, 'weight');
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: Weight validation error stating minimum weight
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /weight|minimum|25/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation is blocked
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);
  });

  test('4d: Weight above maximum should show validation error', async ({ page }) => {
    const weightInput = page.locator('label:has-text("Weight") input[type="number"]');
    await weightInput.fill('251');
    await fillValidProfile(page, 'weight');
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: Weight validation error with valid range
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /weight|maximum|250|range/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation is blocked
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);
  });

  test('4e: Age below minimum should show validation error', async ({ page }) => {
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill('5');
    await fillValidProfile(page, 'age');
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: Age validation error stating minimum age
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /age|minimum|6/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation is blocked
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);
  });

  test('4f: Age above maximum should show validation error', async ({ page }) => {
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill('121');
    await fillValidProfile(page, 'age');
    await page.locator('button', { hasText: 'Continue' }).click();

    // Expected 1: Age validation error with valid range
    const errorMessage = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /age|maximum|120|range/i });
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Expected 2: Navigation is blocked
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*onboarding\/profile/);
  });
});
