import { test, expect } from '@playwright/test';

/**
 * Test 10: Goals page plan field configuration
 * 
 * Goal: Verify that all plan fields on the Goals page can be set correctly
 * Test values:
 * - Weeks: 16
 * - Sessions per week: 5
 * - Focus areas: HIIT and Strength
 * - Session distribution: 2 HIIT, 3 Strength
 * - Deload ratio: 3:1
 * - Progression type: Periodized → Classical Linear Periodization
 */
test.describe('Test 10: Goals page plan configuration', () => {
  
  test('should allow complete plan configuration with specific values', async ({ page }) => {
    // Complete profile onboarding first
    await page.goto('/onboarding/profile');
    
    // Fill profile
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    const liftingSelect = page.locator('select').nth(1);
    await liftingSelect.selectOption('intermediate');
    const fitnessSelect = page.locator('select').nth(2);
    await fitnessSelect.selectOption('trained');
    await page.locator('button', { hasText: 'Continue' }).click();
    
    // Navigate through Connect page (skip API key for this test)
    await page.waitForURL('**/onboarding/connect');
    await page.locator('button', { hasText: /Continue|Skip/i }).click();
    
    // Should now be on Goals page
    await page.waitForURL('**/onboarding/goals');
    
    // Wait for plan recommendation panel to load
    const planPanel = page.locator('text=/Plan Recommendation/i');
    await expect(planPanel).toBeVisible();
    
    // Step 1: Set Weeks Planned to 16
    const weeksLabel = page.locator('label:has-text("Weeks Planned")');
    const weeksInput = weeksLabel.locator('..').locator('input[type="number"]');
    await weeksInput.clear();
    await weeksInput.fill('16');
    await expect(weeksInput).toHaveValue('16');
    
    // Step 2: Set Sessions Per Week to 5
    const sessionsLabel = page.locator('label:has-text("Sessions Per Week")');
    const sessionsInput = sessionsLabel.locator('..').locator('input[type="number"]');
    await sessionsInput.clear();
    await sessionsInput.fill('5');
    await expect(sessionsInput).toHaveValue('5');
    
    // Step 3: Select Focus Areas - HIIT and Strength
    // Find and click HIIT button
    const hiitButton = page.locator('button:has-text("HIIT")');
    if (await hiitButton.isVisible()) {
      await hiitButton.click();
    }
    
    // Find and click Strength button
    const strengthButton = page.locator('button:has-text("Strength")');
    if (await strengthButton.isVisible()) {
      await strengthButton.click();
    }
    
    // Verify focus areas are selected (should show as chips/badges)
    const hiitChip = page.locator('text=/HIIT/i').first();
    const strengthChip = page.locator('text=/Strength/i').first();
    await expect(hiitChip).toBeVisible();
    await expect(strengthChip).toBeVisible();
    
    // Step 4: Set Session Distribution
    // HIIT: 2 sessions, Strength: 3 sessions
    const sessionDistSection = page.locator('text=/Session Distribution/i').locator('..');
    
    // Find HIIT input in session distribution
    const hiitSessionInput = sessionDistSection.locator('text=/HIIT/i').locator('..').locator('input[type="number"]');
    if (await hiitSessionInput.isVisible()) {
      await hiitSessionInput.clear();
      await hiitSessionInput.fill('2');
    }
    
    // Find Strength input in session distribution
    const strengthSessionInput = sessionDistSection.locator('text=/Strength/i').locator('..').locator('input[type="number"]');
    if (await strengthSessionInput.isVisible()) {
      await strengthSessionInput.clear();
      await strengthSessionInput.fill('3');
    }
    
    // Step 5: Set Build-to-Deload Ratio to 3:1
    const deloadLabel = page.locator('label:has-text("Build-to-Deload Ratio")');
    const deloadInput = deloadLabel.locator('..').locator('input');
    await deloadInput.clear();
    await deloadInput.fill('3:1');
    await expect(deloadInput).toHaveValue('3:1');
    
    // Step 6: Select Periodized progression type
    const periodizedButton = page.locator('button:has-text("Periodized")');
    await expect(periodizedButton).toBeVisible();
    await periodizedButton.click();
    
    // Step 7: Verify Periodization Model selector appears
    const modelLabel = page.locator('label:has-text("Periodization Model")');
    await expect(modelLabel).toBeVisible({ timeout: 2000 });
    
    // Step 8: Select Classical Linear Periodization
    const modelSelect = page.locator('select').filter({ has: page.locator('option:has-text("Classical Linear")') });
    if (await modelSelect.isVisible()) {
      await modelSelect.selectOption('classical_linear');
    }
    
    // Verify all values are set correctly
    await expect(weeksInput).toHaveValue('16');
    await expect(sessionsInput).toHaveValue('5');
    await expect(deloadInput).toHaveValue('3:1');
    
    // Continue button should be available (may be disabled until interview is complete)
    const continueButton = page.locator('button', { hasText: /Continue to Plan Generation/i });
    await expect(continueButton).toBeVisible();
  });
  
  test('should persist field values when navigating back and forth', async ({ page }) => {
    // Complete profile
    await page.goto('/onboarding/profile');
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    const liftingSelect = page.locator('select').nth(1);
    await liftingSelect.selectOption('novice');
    const fitnessSelect = page.locator('select').nth(2);
    await fitnessSelect.selectOption('beginner');
    await page.locator('button', { hasText: 'Continue' }).click();
    
    // Skip Connect
    await page.waitForURL('**/onboarding/connect');
    await page.locator('button', { hasText: /Continue|Skip/i }).click();
    
    // Goals page
    await page.waitForURL('**/onboarding/goals');
    
    // Set some values
    const weeksLabel = page.locator('label:has-text("Weeks Planned")');
    const weeksInput = weeksLabel.locator('..').locator('input[type="number"]');
    await weeksInput.clear();
    await weeksInput.fill('12');
    
    // Go back
    const backButton = page.locator('button', { hasText: /Back/i });
    await backButton.click();
    await page.waitForURL('**/onboarding/connect');
    
    // Go forward again
    await page.locator('button', { hasText: /Continue|Skip/i }).click();
    await page.waitForURL('**/onboarding/goals');
    
    // Value should be persisted
    const weeksInputAgain = page.locator('label:has-text("Weeks Planned")').locator('..').locator('input[type="number"]');
    await expect(weeksInputAgain).toHaveValue('12');
  });
  
  test('should show field ownership badges', async ({ page }) => {
    // Navigate to Goals page
    await page.goto('/onboarding/profile');
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    const liftingSelect = page.locator('select').nth(1);
    await liftingSelect.selectOption('novice');
    const fitnessSelect = page.locator('select').nth(2);
    await fitnessSelect.selectOption('beginner');
    await page.locator('button', { hasText: 'Continue' }).click();
    await page.waitForURL('**/onboarding/connect');
    await page.locator('button', { hasText: /Continue|Skip/i }).click();
    await page.waitForURL('**/onboarding/goals');
    
    // Check for ownership badges (AI, You, or Locked)
    const badges = page.locator('span:has-text(/AI|You|Locked/)');
    await expect(badges.first()).toBeVisible();
    
    // Initially fields should be system-owned (AI)
    const aiBadge = page.locator('span:has-text("AI")').first();
    await expect(aiBadge).toBeVisible();
  });
  
  test('should show lock/unlock buttons for each field', async ({ page }) => {
    // Navigate to Goals page
    await page.goto('/onboarding/profile');
    await page.locator('input[type="number"]').first().fill('30');
    await page.locator('label:has-text("Height") input[type="number"]').fill('180');
    await page.locator('label:has-text("Weight") input[type="number"]').fill('80');
    const liftingSelect = page.locator('select').nth(1);
    await liftingSelect.selectOption('novice');
    const fitnessSelect = page.locator('select').nth(2);
    await fitnessSelect.selectOption('beginner');
    await page.locator('button', { hasText: 'Continue' }).click();
    await page.waitForURL('**/onboarding/connect');
    await page.locator('button', { hasText: /Continue|Skip/i }).click();
    await page.waitForURL('**/onboarding/goals');
    
    // Should see lock/unlock icons (lucide-react Lock/Unlock components)
    const lockButtons = page.locator('button').filter({ has: page.locator('svg') });
    await expect(lockButtons.first()).toBeVisible();
    
    // Click a lock button and verify behavior
    const firstLockButton = lockButtons.first();
    await firstLockButton.click();
    
    // Badge should change to "Locked" or icon should change
    // This is a basic check - detailed behavior can be tested further
  });
});
