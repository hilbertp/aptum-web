import { test, expect } from '@playwright/test';

/**
 * Test 7: Lifting and fitness description mapping
 * 
 * Goal: Verify that the lifting experience and fitness level dropdowns always show 
 * the correct description for the selected option, and only one description at a time per field.
 */
test.describe('Test 7: Lifting and fitness description mapping', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should show correct lifting experience descriptions', async ({ page }) => {
    // Find the lifting experience select
    const liftingSelect = page.locator('select', { has: page.locator('option[value="novice"]') });
    
    // Step 2-3: Select Novice and observe the description
    await liftingSelect.selectOption('novice');
    
    // Expected 1: Novice description is visible and correct
    const noviceDesc = page.locator('text=/learning the basics|getting the movement right|showing up and practicing/i');
    await expect(noviceDesc).toBeVisible();
    
    // Step 4-5: Change to Intermediate and observe
    await liftingSelect.selectOption('intermediate');
    
    // Expected 1 continued: Novice description disappears, Intermediate description appears
    await expect(noviceDesc).not.toBeVisible();
    const intermediateDesc = page.locator('text=/train consistently|understand.*RIR and RPE|progressive overload/i');
    await expect(intermediateDesc).toBeVisible();
    
    // Test Advanced
    await liftingSelect.selectOption('advanced');
    await expect(intermediateDesc).not.toBeVisible();
    const advancedDesc = page.locator('text=/training seriously for years|intentionally.*RIR and RPE|periodization/i');
    await expect(advancedDesc).toBeVisible();
    
    // Test Expert
    await liftingSelect.selectOption('expert');
    await expect(advancedDesc).not.toBeVisible();
    const expertDesc = page.locator('text=/many years of lifting|autoregulate|peak.*rebuild/i');
    await expect(expertDesc).toBeVisible();
    
    // Expected: At any time, only one lifting description is visible
    // Count visible descriptions in the lifting area
    const liftingLabel = page.locator('label:has-text("Lifting experience")');
    const visibleDescs = await liftingLabel.locator('.text-xs.text-muted').count();
    expect(visibleDescs).toBeLessThanOrEqual(1);
  });

  test('should show correct fitness level descriptions', async ({ page }) => {
    // Find the fitness level select
    const fitnessSelect = page.locator('select', { has: page.locator('option[value="beginner"]') });
    
    // Step 6-7: Select Beginner and observe
    await fitnessSelect.selectOption('beginner');
    
    // Expected 2: Beginner description is visible and correct
    const beginnerDesc = page.locator('text=/get tired easily|Cardio feels tough|recovery takes a while/i');
    await expect(beginnerDesc).toBeVisible();
    
    // Test Developing
    await fitnessSelect.selectOption('developing');
    await expect(beginnerDesc).not.toBeVisible();
    const developingDesc = page.locator('text=/30.*45 minutes|starting to feel more comfortable/i');
    await expect(developingDesc).toBeVisible();
    
    // Test Trained
    await fitnessSelect.selectOption('trained');
    await expect(developingDesc).not.toBeVisible();
    const trainedDesc = page.locator('text=/endurance.*mixed training|about an hour without fading/i');
    await expect(trainedDesc).toBeVisible();
    
    // Test Athletic
    await fitnessSelect.selectOption('athletic');
    await expect(trainedDesc).not.toBeVisible();
    const athleticDesc = page.locator('text=/train hard and long|Back.*to.*back workouts|bounce back quickly/i');
    await expect(athleticDesc).toBeVisible();
    
    // Step 8-9: Change to Advanced and observe
    await fitnessSelect.selectOption('elite');
    await expect(athleticDesc).not.toBeVisible();
    const eliteDesc = page.locator('text=/exceptional stamina|high intensity for long stretches/i');
    await expect(eliteDesc).toBeVisible();
    
    // Expected: At any time, only one fitness description is visible
    const fitnessLabel = page.locator('label:has-text("Fitness level")');
    const visibleDescs = await fitnessLabel.locator('.text-xs.text-muted').count();
    expect(visibleDescs).toBeLessThanOrEqual(1);
  });

  test('should not show overlapping or mismatched descriptions', async ({ page }) => {
    // Select lifting: intermediate
    const liftingSelect = page.locator('select', { has: page.locator('option[value="novice"]') });
    await liftingSelect.selectOption('intermediate');
    
    // Select fitness: athletic
    const fitnessSelect = page.locator('select', { has: page.locator('option[value="beginner"]') });
    await fitnessSelect.selectOption('athletic');
    
    // Verify correct descriptions are shown
    const intermediateDesc = page.locator('text=/train consistently|understand.*RIR and RPE/i');
    const athleticDesc = page.locator('text=/train hard and long|Back.*to.*back workouts/i');
    
    await expect(intermediateDesc).toBeVisible();
    await expect(athleticDesc).toBeVisible();
    
    // Verify no other descriptions are visible
    const noviceDesc = page.locator('text=/learning the basics/i');
    const beginnerDesc = page.locator('text=/get tired easily/i');
    
    await expect(noviceDesc).not.toBeVisible();
    await expect(beginnerDesc).not.toBeVisible();
    
    // Expected 3: No overlapping descriptions
    // Count total visible description texts
    const allDescriptions = page.locator('.text-xs.text-muted');
    const count = await allDescriptions.count();
    
    // Should have exactly 2 descriptions visible (one for lifting, one for fitness)
    expect(count).toBe(2);
  });

  test('should update description immediately on selection change', async ({ page }) => {
    const liftingSelect = page.locator('select', { has: page.locator('option[value="novice"]') });
    
    // Select novice
    await liftingSelect.selectOption('novice');
    const noviceDesc = page.locator('text=/learning the basics/i');
    await expect(noviceDesc).toBeVisible();
    
    // Quickly change to advanced
    await liftingSelect.selectOption('advanced');
    
    // The description should update without delay
    // Novice description should disappear immediately
    await expect(noviceDesc).not.toBeVisible({ timeout: 500 });
    
    // Advanced description should appear immediately
    const advancedDesc = page.locator('text=/training seriously for years/i');
    await expect(advancedDesc).toBeVisible({ timeout: 500 });
  });
});
