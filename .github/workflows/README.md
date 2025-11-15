# GitHub Actions Workflows

This directory contains automated workflows for CI/CD, testing, and maintenance tasks.

## Workflows

### 🔍 CI Workflow (`ci.yml`)

**Triggers:**
- Pull requests to any branch
- Pushes to `main` branch
- Pushes to `feat/**` branches

**Jobs:**

#### 1. Lint and Type Check
Runs code quality checks to catch errors early.

**Steps:**
- ESLint code linting
- TypeScript type checking

**Purpose:** Ensures code meets quality standards and type safety requirements.

#### 2. Build Application
Compiles the production build to verify no build errors.

**Steps:**
- Runs production build with Vite
- Uploads build artifacts for inspection

**Purpose:** Validates that the code can be successfully built for production.

#### 3. E2E Regression Tests ⭐
Runs comprehensive end-to-end tests to verify functionality.

**Steps:**
- Installs Playwright and Chromium browser
- Runs all E2E test suites (31 tests across 9 scenarios)
- Uploads test reports and screenshots on failure

**Test Coverage:**
- App initialization and routing
- Welcome screen navigation
- Profile form validation (6 edge cases)
- Unit switching and persistence
- Authentication UI
- API key validation
- Dynamic experience/fitness descriptions
- Multi-tab state consistency
- Dev environment cache behavior

**Purpose:** Ensures all critical user flows work correctly before merging.

**Expected Results:**
- ✅ 28 tests passing (100% of runnable tests)
- ⏭️ 5 tests skipped (require full onboarding or credentials)
- ❌ 0 tests failing

---

### 📚 Other Workflows

#### Build KB Index (`build-kb-index.yml`)
Builds the knowledge base index from papers and documentation.

#### Paper Archive (`paper-archive.yml`)
Archives research papers for reference.

#### Paper Notes (`paper-notes.yml`)
Extracts and processes notes from papers.

#### Auto-Merge Workflows
- `auto-merge.yml` - Main auto-merge logic
- `auto-merge-dispatch.yml` - Dispatches auto-merge events
- `auto-merge-on-checks.yml` - Triggers merge after checks pass

## Required Status Checks

To protect the main branch and ensure code quality, configure the following required status checks in GitHub:

1. **Lint and Type Check** - Must pass
2. **Build Application** - Must pass
3. **E2E Regression Tests** - Must pass

### Setting Up Branch Protection

1. Go to repository **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: `Lint and Type Check`
     - Select: `Build Application`
     - Select: `E2E Regression Tests`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings

This ensures that all code merged to `main` has:
- Passed linting and type checking
- Successfully built for production
- Passed all regression tests

## Running Tests Locally

Before pushing, you can run the same checks locally:

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build

# E2E tests
npm run test:e2e

# E2E tests with UI (for debugging)
npm run test:e2e:ui
```

## Troubleshooting

### E2E Tests Failing Locally But Passing in CI

- Ensure your dev server is running (`npm run dev`)
- Clear browser cache and storage
- Check if tests are trying to access protected routes without completing onboarding
- Review test output for specific selector failures

### E2E Tests Timing Out

- Increase timeout in `playwright.config.ts` if needed
- Check if the dev server is slow to start
- Review network requests for hung API calls

### Skipped Tests

Some tests are intentionally skipped because they require:
- Full onboarding flow (Settings page access)
- Environment credentials (`TEST_OPENAI_API_KEY`, `TEST_GOOGLE_EMAIL`, etc.)

These tests have clear TODO comments and can be enabled once prerequisites are met.

## Adding New Workflows

When adding new workflows:
1. Place them in `.github/workflows/`
2. Use descriptive names (e.g., `deploy-production.yml`)
3. Document the workflow in this README
4. Test the workflow on a feature branch first
5. Consider adding status checks if critical
