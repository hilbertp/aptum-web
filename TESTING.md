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
- **E2E Tests:** 28/28 passing (100% of runnable tests) ✅
- **Skipped Tests:** 5 (require full onboarding or credentials)
- **Unit Tests:** Not yet implemented

## E2E Test Suites

| # | Suite | Tests | Status | Notes |
|---|-------|-------|--------|-------|
| 1 | App Loads | 1 | ✅ PASS | None |
| 2 | Navigation | 2 | ✅ PASS | None |
| 3 | Unit Switching | 1 passing, 1 skipped | ✅ PASS | 1 test requires full onboarding |
| 4 | Validation | 6 | ✅ PASS | All edge cases covered |
| 5 | Google Sign-In | 2 passing, 1 skipped | ✅ PASS | 1 test requires credentials |
| 6 | API Key Test | 3 passing, 2 skipped | ✅ PASS | 2 tests require credentials/onboarding |
| 7 | Description Map | 4 | ✅ PASS | All description mappings working |
| 8 | Multi-Tab | 3 passing, 1 skipped | ✅ PASS | 1 test requires full onboarding |
| 9 | Dev Cache | 6 | ✅ PASS | None |

**Total: 28 passing, 5 skipped, 0 failing**

## Fixed Issues ✅

### 1. Profile Validation - FIXED ✅
**Problem:** Users could enter invalid data (age 5, height 300 cm, weight 1 kg)

**Solution Implemented:**
```typescript
// src/schemas/product.ts
export const ProfileSchema = z.object({
  ageYears: z.number().int().min(6).max(120),
  heightCm: z.number().min(50).max(250),
  weightKg: z.number().min(25).max(250),
  liftingExperience: z.string().min(1),
  fitnessLevel: z.string().min(1),
  // ...
});
```

**Changes Made:**
- ✅ Comprehensive Zod validation schema
- ✅ Custom error messages for all fields
- ✅ Error display in UI (alert box + inline errors)
- ✅ Required field indicators (red asterisks)
- ✅ Validation on Continue button click

### 2. Profile Data Persistence - FIXED ✅
**Problem:** Form data lost when navigating between pages

**Solution Implemented:**
```typescript
// src/pages/onboarding/Profile.tsx
useEffect(() => {
  loadProfile().then(saved => {
    if (saved) setProfile({ ...saved, units: settings.units });
    setLoading(false);
  });
}, [settings.units]);
```

**Changes Made:**
- ✅ Profile data loaded on component mount
- ✅ Data restored when navigating back to profile page
- ✅ Unit preference respected from settings

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

## CI/CD Integration ✅

### Automated Testing on PRs

The CI workflow (`.github/workflows/ci.yml`) automatically runs on:
- ✅ All pull requests
- ✅ Pushes to `main` branch
- ✅ Pushes to `feat/**` branches

**CI Pipeline Jobs:**

1. **Lint and Type Check**
   - Runs ESLint
   - Runs TypeScript type checking

2. **Build Application**
   - Compiles production build
   - Uploads build artifacts

3. **E2E Regression Tests** ⭐
   - Installs Playwright and Chromium
   - Runs all 33 E2E tests
   - Uploads test reports and screenshots on failure

**Expected Results:**
- ✅ 28 tests passing
- ⏭️ 5 tests skipped (documented reasons)
- ❌ 0 tests failing

### Branch Protection

Configure these required status checks in GitHub:
- ✅ Lint and Type Check
- ✅ Build Application
- ✅ E2E Regression Tests

This ensures all code merged to `main` has passed all quality checks.

See `.github/workflows/README.md` for detailed CI documentation.

## Documentation

- **TEST_RESULTS_FINAL.md** - Current test results and comprehensive documentation ⭐
- **TEST_RESULTS.md** - Historical results and failure analysis
- **e2e/README.md** - Test suite specification and requirements
- **.github/workflows/README.md** - CI/CD workflow documentation
- **playwright.config.ts** - Playwright configuration

## Next Steps

1. ✅ E2E test suite implemented (31 tests)
2. ✅ Fixed profile validation
3. ✅ Fixed profile persistence
4. ✅ All runnable tests passing (28/28)
5. ✅ CI/CD workflow configured
6. ⏭️ Implement full onboarding helper for skipped tests
7. ⏭️ Implement unit tests for Week 1 code:
   - `src/services/periodization.ts`
   - `src/services/planEngine.ts`
   - `src/stores/plan.ts`

## Resources

- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- Test spec provided by user in conversation
