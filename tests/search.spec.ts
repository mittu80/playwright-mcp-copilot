import { test, chromium, firefox } from '@playwright/test';
import { expect } from '@playwright/test';

test.describe('Movie Search Tests', () => {
  const browsers = [
    { name: 'Chromium', instance: chromium },
    { name: 'Firefox', instance: firefox },
    { 
      name: 'Microsoft Edge', 
      instance: chromium,
      launchOptions: {
        channel: 'msedge'
      }
    }
  ];

  for (const browser of browsers) {
    test(`can search for Garfield movie in ${browser.name}`, async () => {
      let browserInstance;
      let context;
      let page;

      try {
        console.log(`Launching ${browser.name} browser...`);
        browserInstance = await browser.instance.launch({ 
          headless: false,
          ...(browser.launchOptions || {}),
          args: browser.name === 'Firefox' ? ['--no-remote'] : [] // Special args for Firefox
        });
        
        // Create a context with cleared storage states
        console.log(`Creating new context in ${browser.name} with cleared cache...`);
        context = await browserInstance.newContext({
          storageState: undefined // This ensures no stored state is loaded
        });

        // Clear all browser caches before starting
        await context.clearCookies();
        const pages = context.pages();
        for (const p of pages) {
          await p.close(); // Close any existing pages
        }
        
        console.log(`Creating new page in ${browser.name}...`);
        page = await context.newPage();

        // Navigate to the movies app
        console.log('Navigating to the movies app...');
        await page.goto('https://debs-obrien.github.io/playwright-movies-app', {
          waitUntil: 'networkidle',
          // Force reload from server, don't use cache
          referer: ''
        });
        
        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Click the search button to focus the search input
        await page.getByRole('search').click();

        // Type "Garfield" into the search input and press Enter
        await page.getByRole('textbox', { name: 'Search Input' }).fill('Garfield');
        await page.getByRole('textbox', { name: 'Search Input' }).press('Enter');

        // Wait for the search results to load
        await page.waitForLoadState('networkidle');

        // Verify the search results
        await expect(page.getByRole('heading', { name: 'Garfield', level: 1 })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'The Garfield Movie', level: 2 })).toBeVisible();

        // Add a small delay to see the results
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error(`Error in ${browser.name} browser:`, error);
        throw error;
      } finally {
        // Clean up and clear cache before closing
        if (context) {
          console.log(`Cleaning up ${browser.name} browser context...`);
          await context.clearCookies();
          
          // Clear all cached data
          if (page) {
            await page.evaluate(() => {
              if (window.caches) {
                // Clear all cache storage
                caches.keys().then(keys => {
                  keys.forEach(key => caches.delete(key));
                });
              }
              // Clear local and session storage
              localStorage.clear();
              sessionStorage.clear();
            });
          }
          
          await context.close();
        }
        if (browserInstance) {
          console.log(`Closing ${browser.name} browser...`);
          await browserInstance.close();
        }
      }
    });
  }
});
