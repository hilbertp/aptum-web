import { test, expect } from '@playwright/test';

/**
 * Test 3: Profile screen happy path with unit switch
 * 
 * Goal: Verify entering valid profile data and switching from metric to imperial.
 * Confirm that values and unit settings are applied correctly and consistently.
 */
test.describe('Test 3: Profile screen happy path with unit switch', () => {
  test('should accept valid profile data and switch units correctly', async ({ page }) => {
    // Step 1: Navigate to the profile screen from the welcome flow
    await page.goto('/onboarding/profile');
    await expect(page.locator('h2')).toContainText('Your Profile');

    // Step 2: Enter age 30
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill('30');

    // Step 3: Select gender Male
    const genderSelect = page.locator('select').first();
    await genderSelect.selectOption('Male');

    // Step 4: Enter height 180 with metric selected
    // Find the height input (should have label with 'cm' initially)
    const heightLabel = page.locator('text=/Height.*cm/i');
    await expect(heightLabel).toBeVisible();
    const heightInput = page.locator('label:has-text("Height") input[type="number"]');
    await heightInput.fill('180');

    // Step 5: Enter weight 80 with metric selected
    const weightLabel = page.locator('text=/Weight.*kg/i');
    await expect(weightLabel).toBeVisible();
    const weightInput = page.locator('label:has-text("Weight") input[type="number"]');
    await weightInput.fill('80');

    // Step 6: Select lifting experience Novice
    const liftingSelect = page.locator('select', { has: page.locator('option[value="novice"]') });
    await liftingSelect.selectOption('novice');

    // Step 7: Select fitness level Beginner
    const fitnessSelect = page.locator('select', { has: page.locator('option[value="beginner"]') });
    await fitnessSelect.selectOption('beginner');

    // Step 8: Confirm there are no validation errors visible
    const errorMessages = page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessages).toHaveCount(0);

    // Step 9: Switch the unit setting from metric to imperial
    const unitsSelect = page.locator('label:has-text("Units") select');
    await unitsSelect.selectOption('imperial');

    // Expected 2: After switching to imperial, height and weight are converted
    // Wait for the conversion to happen
    await page.waitForTimeout(500);

    // Height 180 cm should convert to approximately 70.9 inches
    const heightValue = await heightInput.inputValue();
    const heightNum = parseFloat(heightValue);
    expect(heightNum).toBeGreaterThan(70);
    expect(heightNum).toBeLessThan(72);

    // Weight 80 kg should convert to approximately 176.4 lbs
    const weightValue = await weightInput.inputValue();
    const weightNum = parseFloat(weightValue);
    expect(weightNum).toBeGreaterThan(175);
    expect(weightNum).toBeLessThan(178);

    // Labels should change to imperial units
    await expect(page.locator('text=/Height.*in/i')).toBeVisible();
    await expect(page.locator('text=/Weight.*lb/i')).toBeVisible();

    // Step 10: Navigate to at least one other screen that shows height or weight
    await page.locator('button', { hasText: 'Continue' }).click();
    await page.waitForURL('**/onboarding/connect');

    // Step 11: Navigate back to the profile screen
    await page.goto('/onboarding/profile');

    // Expected 4: After navigating away and back, the imperial setting and converted values remain
    await expect(page.locator('text=/Height.*in/i')).toBeVisible();
    await expect(page.locator('text=/Weight.*lb/i')).toBeVisible();
    
    const heightValueAfterNav = await heightInput.inputValue();
    const weightValueAfterNav = await weightInput.inputValue();
    expect(parseFloat(heightValueAfterNav)).toBeCloseTo(heightNum, 1);
    expect(parseFloat(weightValueAfterNav)).toBeCloseTo(weightNum, 1);

    // Step 12: Reload the app and return to the profile screen
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Expected 5: After reload, the imperial unit preference is still active
    await expect(page.locator('text=/Height.*in/i')).toBeVisible();
    await expect(page.locator('text=/Weight.*lb/i')).toBeVisible();
  });

  test.skip('should persist unit preference across settings and profile pages', async ({ page }) => {
    // TODO: This test requires completing full onboarding flow to access Settings
    // Currently Settings page is behind RequireOnboarding guard
    // First complete onboarding to access settings
    await page.goto('/onboarding/profile');
    
    // Fill required fields
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    const liftingSelect = page.locator('select').nth(1);
    await liftingSelect.selectOption('novice');
    const fitnessSelect = page.locator('select').nth(2);
    await fitnessSelect.selectOption('beginner');
    
    // Save profile
    await page.locator('button', { hasText: 'Continue' }).click();
    await page.waitForURL('**/onboarding/connect');
    
    // Now go to settings
    await page.goto('/settings');
    const unitsSelect = page.locator('select[value="metric"], select[value="imperial"]').first();
    await unitsSelect.selectOption('imperial');
    
    // Navigate to profile
    await page.goto('/onboarding/profile');
    
    // Expected: Profile should show imperial units
    await expect(page.locator('text=/Height.*in/i')).toBeVisible();
    await expect(page.locator('text=/Weight.*lb/i')).toBeVisible();
  });
});
