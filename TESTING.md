# Aptum Testing Guide

## Quick Reference

### Run Tests
```bash
# E2E regression tests
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Interactive mode
npx playwright test --headed  # See browser

# Unit tests (when implemented)
npm run test                  # Run vitest unit tests
```

### Current Test Status
- **E2E Tests:** 17/29 passing (58.6%)
- **Unit Tests:** Not yet implemented

## E2E Test Suites

| # | Suite | Tests | Status | Priority Issues |
|---|-------|-------|--------|-----------------|
| 1 | App Loads | 1 | ✅ PASS | None |
| 2 | Navigation | 2 | ✅ PASS | None |
| 3 | Unit Switching | 2 | ❌ FAIL | Persistence |
| 4 | Validation | 6 | ❌ FAIL | **No validation** |
| 5 | Google Sign-In | 3 | ⚠️ PARTIAL | Auth flow skipped |
| 6 | API Key Test | 4 | ⚠️ PARTIAL | Selector issues |
| 7 | Description Map | 4 | ⚠️ PARTIAL | Regex issues |
| 8 | Multi-Tab | 4 | ⚠️ PARTIAL | Selector issues |
| 9 | Dev Cache | 6 | ✅ PASS | None |

## Critical Issues

### 1. Missing Profile Validation ⚠️ CRITICAL
**Impact:** Users can enter invalid data (age 5, height 300 cm, weight 1 kg)

**Fix Required:**
```typescript
// src/schemas/product.ts
export const ProfileSchema = z.object({
  ageYears: z.number().int().min(6).max(120).optional(),
  heightCm: z.number().min(50).max(250).optional(),
  weightKg: z.number().min(30).max(250).optional(),
  // ...
});
```

**UI Changes:** 
- Add validation before navigation in Profile.tsx
- Display error messages for invalid inputs
- Block Continue button when validation fails

### 2. Profile Data Not Persisting
**Impact:** Form data lost when navigating between pages

**Fix Required:**
- Save profile to localStorage on field change
- Restore profile from localStorage on page load
- Or use React Context/Zustand for form state

## Test Development

### Add New Test
```typescript
// e2e/10-my-new-test.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Test 10: My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Add data-testid to Components
```typescript
// Recommended for stable selectors
<button data-testid="submit-button">Submit</button>

// In tests
await page.locator('[data-testid="submit-button"]').click();
```

## Debugging Failed Tests

```bash
# Run single test with debug
npx playwright test --debug e2e/04-profile-validation.spec.ts

# View screenshots from last run
open test-results/*/test-failed-*.png

# View HTML report
npm run test:e2e:report
```

## CI/CD Integration

Tests are ready for CI/CD:
```yaml
# .github/workflows/e2e-tests.yml
- run: npx playwright install --with-deps
- run: npm run test:e2e
```

## Documentation

- **TEST_RESULTS.md** - Detailed results and failure analysis
- **e2e/README.md** - Test suite documentation
- **playwright.config.ts** - Configuration

## Next Steps

1. ✅ E2E test suite implemented
2. ⏭️ Fix profile validation (Priority 1)
3. ⏭️ Fix profile persistence (Priority 2)
4. ⏭️ Re-run tests (target: 85%+ pass rate)
5. ⏭️ Implement unit tests for Week 1 code:
   - `src/services/periodization.ts`
   - `src/services/planEngine.ts`
   - `src/stores/plan.ts`

## Resources

- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- Test spec provided by user in conversation
