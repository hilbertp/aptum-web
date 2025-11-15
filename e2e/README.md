# Aptum E2E Regression Test Suite

Comprehensive end-to-end regression tests for the Aptum training application.

## Overview

This test suite covers 9 major test scenarios across onboarding, profile management, authentication, API integration, and multi-tab behavior. Tests are automated using Playwright and can be run locally or in CI/CD pipelines.

## Test Coverage

| # | Test Suite | Description | Tests |
|---|------------|-------------|-------|
| 1 | App Loads | Verifies app initialization and welcome screen | 1 |
| 2 | Navigation Flow | Tests onboarding screen progression | 2 |
| 3 | Unit Switching | Tests metric/imperial conversion and persistence | 2 |
| 4 | Profile Validation | Tests input validation (age, height, weight) | 6 |
| 5 | Google Sign-In | Tests OAuth authentication flow | 3 |
| 6 | API Key Testing | Tests OpenAI API key validation | 4 |
| 7 | Description Mapping | Tests experience/fitness level descriptions | 4 |
| 8 | Multi-Tab Sanity | Tests state consistency across browser tabs | 4 |
| 9 | Dev Cache | Tests service worker and cache management | 6 |

**Total:** 31 tests (29 active + 2 intentionally skipped)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/01-app-loads.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# View last test report
npm run test:e2e:report
```

## Test Files

```
e2e/
├── 01-app-loads.spec.ts           # Initial app load and rendering
├── 02-welcome-navigation.spec.ts  # Onboarding flow navigation
├── 03-profile-unit-switch.spec.ts # Unit conversion and persistence
├── 04-profile-validation.spec.ts  # Input validation (6 sub-tests)
├── 05-google-signin.spec.ts       # OAuth authentication
├── 06-api-key-test.spec.ts        # API key validation
├── 07-description-mapping.spec.ts # Dynamic description display
├── 08-multi-tab.spec.ts           # Multi-tab state management
└── 09-dev-cache.spec.ts           # Service worker and cache tests
```

## Environment Variables

Optional environment variables for full test coverage:

```bash
# For Test 6a: Valid API key testing
export TEST_OPENAI_API_KEY="sk-..."

# For Test 5: Google OAuth testing (if not mocked)
export TEST_USER_PASSWORD="..."
```

## Test Design Principles

### 1. Independence
Each test is independent and can run in any order. Tests do not depend on state from previous tests.

### 2. Readability
Tests follow the spec document structure with clear step-by-step comments matching the test plan.

### 3. Resilience
Tests use appropriate waits, timeouts, and error handling to reduce flakiness.

### 4. Coverage
Tests verify both happy paths and unhappy paths (validation, errors, edge cases).

## Common Patterns

### Navigating to a page
```typescript
await page.goto('/onboarding/profile');
await page.waitForLoadState('networkidle');
```

### Filling forms
```typescript
const input = page.locator('input[type="number"]').first();
await input.fill('30');
```

### Asserting visibility
```typescript
await expect(page.locator('h1')).toContainText('Welcome');
await expect(errorMessage).toBeVisible();
await expect(successIcon).not.toBeVisible();
```

### Waiting for navigation
```typescript
await page.locator('button', { hasText: 'Continue' }).click();
await page.waitForURL('**/onboarding/connect');
```

## Known Limitations

### Skipped Tests
- **Test 5 - Google OAuth**: Requires real credentials or mocked provider
- **Test 6a - Valid API key**: Requires `TEST_OPENAI_API_KEY` environment variable

### Expected Failures (Until Fixed)
- **Test 4 (all 6 sub-tests)**: Profile validation not implemented
- **Test 3**: Profile data persistence issues
- **Test 6b**: API key input locator issues
- **Test 7**: Description regex matching too broad
- **Test 8**: Multi-tab selector syntax errors

See `TEST_RESULTS.md` for full details.

## Debugging Failed Tests

### View screenshots
Failed tests automatically capture screenshots:
```
test-results/<test-name>/test-failed-1.png
```

### Run in debug mode
```bash
npx playwright test --debug e2e/04-profile-validation.spec.ts
```

### Run with trace
```bash
npx playwright test --trace on
```

Then view the trace:
```bash
npx playwright show-trace trace.zip
```

### Check error context
Each failed test has an error context file:
```
test-results/<test-name>/error-context.md
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Writing New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Test N: Description', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Step 1: Action
    await page.locator('button').click();
    
    // Expected: Assertion
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Best Practices
1. Use descriptive test names
2. Add comments matching the test spec
3. Use appropriate timeouts
4. Clean up after tests (if needed)
5. Use `data-testid` attributes for critical elements
6. Avoid hard-coded waits (use `waitForLoadState`, `waitForURL`, etc.)

## Playwright Configuration

See `playwright.config.ts` for full configuration:
- Base URL: `http://localhost:5173`
- Browser: Chromium
- Reporter: HTML
- Trace: On first retry
- Screenshots: On failure

## Updating Tests

When updating the app:
1. Update relevant test files
2. Update expected behaviors in assertions
3. Run full test suite
4. Update `TEST_RESULTS.md` if needed

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Specification](../docs/TEST_SPECIFICATION.md) (if available)
- [Test Results](../TEST_RESULTS.md)

## Support

For issues with tests:
1. Check `TEST_RESULTS.md` for known issues
2. Run in debug mode to investigate
3. Review screenshots and traces
4. Update test selectors if UI changed
5. Add `data-testid` attributes to components if needed
