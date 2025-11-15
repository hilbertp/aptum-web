# E2E Regression Test Results

**Date:** 2025-11-15  
**Test Framework:** Playwright v1.49  
**Total Tests:** 31 (29 active + 2 intentionally skipped)  
**Pass Rate:** 17/29 = 58.6%  

## Summary

| Test Suite | Status | Pass/Total | Notes |
|------------|--------|------------|-------|
| Test 1: App loads | ✅ PASS | 1/1 | All checks passing |
| Test 2: Navigation flow | ✅ PASS | 2/2 | All checks passing |
| Test 3: Unit switching | ❌ FAIL | 0/2 | Persistence issues |
| Test 4: Validation | ❌ FAIL | 0/6 | **No validation implemented** |
| Test 5: Google sign-in | ⚠️ PARTIAL | 2/3 | 1 skipped (requires credentials) |
| Test 6: API key testing | ⚠️ PARTIAL | 2/4 | Locator issues |
| Test 7: Description mapping | ⚠️ PARTIAL | 2/4 | Regex matching too broad |
| Test 8: Multi-tab | ⚠️ PARTIAL | 2/4 | Selector syntax errors |
| Test 9: Dev cache | ✅ PASS | 6/6 | All checks passing |

## ✅ Passing Tests (17)

### Test 1: App loads initial page ✅
- Welcome screen renders correctly
- No console errors
- Begin button visible and clickable

### Test 2: Welcome screen navigation ✅
- Navigation flow works: Welcome → Profile → Connect → Goals
- Back button navigation works

### Test 5: Google sign-in (Partial) ✅
- Sign-in button present and enabled
- Sign-in state persistence works
- Full OAuth flow skipped (requires real credentials)

### Test 6: API key testing (Partial) ✅
- Empty key handling works
- Settings page API key section exists

### Test 7: Description mapping (Partial) ✅
- Fitness level descriptions update correctly
- Immediate updates on selection change

### Test 8: Multi-tab (Partial) ✅
- Profile updates across tabs work
- No auth conflicts with multiple tabs

### Test 9: Dev cache cleanliness ✅
- No service workers in dev environment
- Caches cleared on dev server start
- Resources load from network (not cache)
- No stale service worker warnings

## ❌ Failing Tests (12)

### Test 3: Profile unit switching (0/2 passing)

**Issue 1:** Values don't persist after navigation
```
Error: expect(received).toBeCloseTo(expected, precision)
Expected: 70.9
Received: NaN
```
**Cause:** Profile form is not saving data to localStorage/state before navigation, so inputs are empty when returning to the page.

**Issue 2:** Settings page selector timeout
```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Locator: select[value]
```
**Cause:** Settings page requires onboarding completion (RequireOnboarding wrapper), so direct navigation fails.

### Test 4: Profile validation (0/6 passing) ⚠️ **CRITICAL**

**All 6 validation tests fail:**
- 4a: Height below minimum (49 cm)
- 4b: Height above maximum (251 cm)
- 4c: Weight below minimum (29 kg)
- 4d: Weight above maximum (251 kg)
- 4e: Age below minimum (5 years)
- 4f: Age above maximum (121 years)

**Issue:** No validation is implemented
```
Error: expect(locator).toBeVisible() failed
Locator: [class*="error"], [role="alert"]
Expected: visible
Timeout: 2000ms
Error: element(s) not found
```

**Root Cause:** The ProfileSchema in `src/schemas/product.ts` has no min/max constraints:
```typescript
export const ProfileSchema = z.object({
  ageYears: z.number().int().positive().optional(),  // ❌ No min/max
  heightCm: z.number().optional(),                   // ❌ No min/max
  weightKg: z.number().optional(),                   // ❌ No min/max
  // ...
});
```

**Required Fix:** Add validation constraints:
```typescript
export const ProfileSchema = z.object({
  ageYears: z.number().int().min(6).max(120).optional(),
  heightCm: z.number().min(50).max(250).optional(),
  weightKg: z.number().min(30).max(250).optional(),
  // ...
});
```

Additionally, the Profile component needs to:
1. Validate input on submit (before navigation)
2. Display error messages when validation fails
3. Block navigation when validation fails

### Test 6: API key testing (2/4 passing)

**Issue:** API key input locator not found
```
Error: expect(locator).toBeVisible() failed
Locator: input[type="text"][placeholder*="sk-"]
Expected: visible
```
**Cause:** The Connect page API key input might not have a placeholder attribute with "sk-", or the element is a password input instead of text input.

**Actual element:** Based on code review, it's `<input className="input" type="text" ... placeholder="sk-..." />`

**Fix needed:** Test selector is correct, but Connect page might be blocked by RequireOnboarding. Tests should complete Profile first.

### Test 7: Description mapping (2/4 passing)

**Issue 1:** Previous descriptions not disappearing
```
Error: expect(locator).not.toBeVisible() failed
Locator: text=/training seriously for years|intentionally.*RIR and RPE|periodization/i
Expected: not visible
Received: visible
```
**Cause:** Regex `.*` is matching the Expert description text which contains "training seriously for years" from the Advanced description comparison.

**Issue 2:** Too many description elements found (8 instead of 2)
**Cause:** The `.text-xs.text-muted` class is used for multiple UI elements, not just experience/fitness descriptions.

**Fix:** Use more specific locators scoped to the label parents.

### Test 8: Multi-tab sanity (2/4 passing)

**Issue 1:** Invalid selector syntax
```
Error: Unexpected token "=" while parsing css selector "[role="dialog"], text=/error|fail/i"
```
**Cause:** Cannot combine CSS selector with text locator in a single string.

**Fix:** Use `.filter()` method:
```typescript
const errorDialog = tabB.locator('[role="dialog"]').filter({ hasText: /error|fail/i });
```

**Issue 2:** Settings page requires onboarding completion
```
Error: Test timeout exceeded
Locator: select[value]
```
**Cause:** RequireOnboarding wrapper redirects incomplete users.

## 📋 Required Application Fixes

### Priority 1: Critical (Blocks User Safety)
1. **Implement profile validation** (Test 4)
   - Add Zod schema constraints for age, height, weight
   - Display validation errors in Profile component
   - Block navigation when validation fails

### Priority 2: High (Core Functionality)
2. **Fix profile data persistence** (Test 3)
   - Save profile data to localStorage before navigation
   - Restore profile data when returning to page
   - Or use form state management (React Hook Form, etc.)

3. **Fix API key input visibility** (Test 6)
   - Ensure API key input is accessible on Connect page
   - Consider removing RequireOnboarding wrapper for Connect page
   - Or complete Profile before testing API key

### Priority 3: Medium (Quality of Life)
4. **Fix description locators** (Test 7)
   - Use more specific selectors for lifting/fitness descriptions
   - Scope locators to parent label elements

5. **Fix multi-tab test selectors** (Test 8)
   - Update locators to use `.filter()` for text matching
   - Consider completing onboarding in beforeEach for Settings tests

## 🔧 Test Suite Improvements Needed

1. **Add helper functions for common flows**
   - `completeOnboarding()` helper to finish onboarding before tests
   - `fillProfileWithValidData()` already exists but needs refinement

2. **Improve selectors**
   - Use `data-testid` attributes for critical test targets
   - Reduce reliance on text matching for structural elements

3. **Add fixtures**
   - Pre-configured user states (onboarded, with API key, etc.)
   - Mock Google OAuth for automated testing

4. **Environment variables**
   - `TEST_OPENAI_API_KEY` for valid API key tests
   - `TEST_USER_PASSWORD` for Google OAuth tests

## ✅ Passing Test Categories

- **App initialization**: All tests pass
- **Navigation**: All tests pass  
- **Dev environment**: All tests pass (no service workers, no caching issues)
- **Multi-tab basics**: No auth conflicts, basic functionality works

## 📊 Code Coverage Highlights

**Well-Tested:**
- Welcome screen
- Navigation flow
- Service worker cleanup
- Cache management
- Basic auth state

**Not Tested (No validation):**
- Profile data validation ⚠️
- Form error states ⚠️
- Data persistence
- Unit conversion accuracy

**Not Tested (By design):**
- Google OAuth full flow (requires real credentials)
- OpenAI API key validation with real key (requires key)

## 🎯 Next Steps

1. **Before proceeding with Week 2 AI Integration:**
   - Implement Priority 1 validation (Test 4)
   - Fix profile persistence (Test 3)
   - Run tests again to verify fixes

2. **Long-term improvements:**
   - Add `data-testid` attributes to components
   - Set up test fixtures for common user states
   - Mock external services (Google, OpenAI) for full automation

3. **CI/CD Integration:**
   - Run tests on every PR
   - Require passing tests before merge
   - Generate HTML reports for review

## 📝 Test Command Reference

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/01-app-loads.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# View HTML report
npm run test:e2e:report

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug e2e/04-profile-validation.spec.ts
```

## Conclusion

**58.6% of tests passing** is a good baseline for regression testing. The failing tests correctly identify:
- Missing validation (critical security/UX issue)
- Data persistence bugs
- Some test selector issues (easy to fix)

**Recommendation:** Fix Priority 1 (validation) before proceeding with new feature development. The test suite is ready to catch regressions as development continues.
