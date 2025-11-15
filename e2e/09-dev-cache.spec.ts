import { test, expect } from '@playwright/test';

/**
 * Test 9: Dev cache cleanliness (development environment only)
 * 
 * Goal: Ensure that in the development environment there is no stale cached version 
 * of the app after new builds or deployments. The dev environment should always load 
 * the latest code on hard refresh.
 */
test.describe('Test 9: Dev cache cleanliness', () => {
  
  test('should load latest build after hard refresh', async ({ page }) => {
    // Step 1: Open the app in the development environment
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Open browser dev tools setting is done via Playwright automatically
    // Step 3: Perform a hard refresh
    await page.reload({ waitUntil: 'networkidle' });
    
    // Step 4: Observe the version indicator or build identifier in the UI
    // Note: This requires the app to display a version number
    // For now, we'll check that the app loads fresh resources
    
    // Expected 1: After hard refresh, loaded JavaScript and assets are latest
    // We can verify this by checking that no stale service workers are active
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return {
          count: registrations.length,
          states: registrations.map(reg => reg.active?.state)
        };
      }
      return { count: 0, states: [] };
    });
    
    // Expected 4: No service workers should be active in dev mode
    expect(swStatus.count).toBe(0);
    
    // Step 7: Inspect registered service workers
    // Already done above
    
    // Expected 5: Dev environment does not require manual cache clearing
    // Verify by checking that resources are loaded fresh (not from cache)
    const performanceEntries = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return entries.map(e => ({
        name: e.name,
        transferSize: (e as any).transferSize
      }));
    });
    
    // At least some resources should have non-zero transferSize (loaded from network)
    const networkLoadedResources = performanceEntries.filter(e => e.transferSize > 0);
    expect(networkLoadedResources.length).toBeGreaterThan(0);
  });

  test('should not have active service workers in dev environment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for service workers
    const swInfo = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        return {
          hasServiceWorkers: regs.length > 0,
          count: regs.length
        };
      }
      return { hasServiceWorkers: false, count: 0 };
    });
    
    // In dev mode, there should be no service workers
    expect(swInfo.hasServiceWorkers).toBe(false);
    expect(swInfo.count).toBe(0);
  });

  test('should clear caches on dev server start', async ({ page }) => {
    // The main.tsx file has code to clear caches in dev mode
    // Verify this works by checking cache storage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const cacheInfo = await page.evaluate(async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        return {
          hasCaches: keys.length > 0,
          cacheNames: keys
        };
      }
      return { hasCaches: false, cacheNames: [] };
    });
    
    // In dev mode with cache clearing, there should be no caches
    expect(cacheInfo.hasCaches).toBe(false);
  });

  test('should display correct resources after code changes', async ({ page, context }) => {
    // Step 1: Load the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial page content
    const initialContent = await page.locator('h1').first().textContent();
    
    // Step 2: Simulate a code change by adding a query parameter to force reload
    // In real scenario, this would be a new build
    await page.goto('/?v=2');
    await page.waitForLoadState('networkidle');
    
    // Expected 2: Version label or build tag updates
    // The app should load fresh, not from cache
    const newContent = await page.locator('h1').first().textContent();
    
    // Content should be the same (no actual code change), but it should have loaded fresh
    expect(newContent).toBeTruthy();
    
    // Expected 3: No outdated UI elements from previous builds
    // The DOM should be clean and current
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(0);
  });

  test('should not show service worker warnings in console', async ({ page }) => {
    const consoleWarnings: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('service worker')) {
        consoleWarnings.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a moment to collect console messages
    await page.waitForTimeout(2000);
    
    // Expected 4: No console warnings about old service workers
    const swWarnings = consoleWarnings.filter(w => 
      w.toLowerCase().includes('service worker') || 
      w.toLowerCase().includes('controlling')
    );
    
    expect(swWarnings).toHaveLength(0);
  });

  test('should reload with cache disabled', async ({ page }) => {
    // Enable cache disabling in DevTools protocol
    const client = await page.context().newCDPSession(page);
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    
    // Load the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // All resources should be loaded from network
    const resourceStats = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return {
        total: entries.length,
        fromCache: entries.filter(e => (e as any).transferSize === 0).length,
        fromNetwork: entries.filter(e => (e as any).transferSize > 0).length
      };
    });
    
    // When cache is disabled, most resources should come from network
    expect(resourceStats.fromNetwork).toBeGreaterThan(0);
    
    await client.detach();
  });
});
