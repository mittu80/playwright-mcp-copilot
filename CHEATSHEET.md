# Playwright Multi-Browser Testing Cheatsheet

## Important File Locations

### Configuration Files
1. **VS Code Settings**
   ```
   C:/Users/[username]/AppData/Roaming/Code/User/settings.json
   ```
   - Contains MCP server configuration
   - Key settings:
   ```json
   "mcp": {
     "servers": {
       "playwright": {
         "command": "npx",
         "args": [
           "-y",
           "@playwright/mcp@latest"
         ]
       }
     }
   }
   ```

2. **Project Configuration**
   ```
   playwright-mcp/playwright.config.ts
   ```
   - Controls test execution behavior
   - Key settings:
   ```typescript
   export default defineConfig({
     testDir: './tests',
     fullyParallel: false,
     workers: 1,
     reporter: 'list',
     use: {
       headless: false
     }
   });
   ```

3. **MCP Configuration**
   ```
   playwright-mcp/mcp.json
   ```
   - Configures Model Context Protocol settings
   - Essential for browser automation

### Test Files Location
```
playwright-mcp/tests/search.spec.ts
```

### Prompts Location
```
playwright-mcp/Prompts/search_garfield.md
```

## Common Issues & Solutions

### 1. Browser Installation Issues

**Problem**: "Could not find browser"
```
Error: Executable doesn't exist at...
```

**Solution**: 
```powershell
# Install all required browsers
npx playwright install chromium firefox msedge

# If you get permission errors, try:
npx playwright install --force
```

### 2. Firefox "XPCOM" Error

**Problem**: 
```
Error: Could not load XPCOM
```

**Solution**:
1. Remove Firefox installation
2. Reinstall using:
```powershell
npx playwright install firefox --force
```

### 3. Test Running Multiple Times

**Problem**: Tests running 15 times instead of 3

**Solution**:
1. Check `playwright.config.ts`
2. Ensure only one project configuration:
```typescript
projects: [
  {
    name: 'search-tests',
    testMatch: '**/search.spec.ts'
  }
]
```

### 4. Cache Issues

**Problem**: Tests failing due to stale cache

**Solution**: Add cache clearing code:
```typescript
// Clear all cached data
if (page) {
  await page.evaluate(() => {
    if (window.caches) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
    localStorage.clear();
    sessionStorage.clear();
  });
}
```

## Project Structure Best Practices

### 1. File Organization
```
playwright-mcp/
├── tests/
│   └── search.spec.ts    # Test files
├── playwright.config.ts  # Configuration
└── package.json         # Dependencies
```

### 2. Required Dependencies
```json
{
  "devDependencies": {
    "@playwright/test": "latest",
    "typescript": "latest",
    "@types/node": "latest"
  }
}
```

## Running Tests

### Basic Test Run
```powershell
npx playwright test
```

### Run Specific Test
```powershell
npx playwright test tests/search.spec.ts
```

### Debug Mode
```powershell
$env:PWDEBUG=1; npx playwright test
```

## Test Writing Template

```typescript
import { test, chromium, firefox } from '@playwright/test';
import { expect } from '@playwright/test';

test.describe('Test Suite Name', () => {
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
    test(`test name in ${browser.name}`, async () => {
      // Test code here
    });
  }
});
```

## GitHub & Copilot Configuration

### GitHub Setup
1. **Repository Configuration**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin [your-repo-url]
   git push -u origin main
   ```

2. **GitHub Actions Setup**
   Create `.github/workflows/playwright.yml`:
   ```yaml
   name: Playwright Tests
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - name: Install dependencies
           run: npm ci
         - name: Install Playwright browsers
           run: npx playwright install
         - name: Run tests
           run: npx playwright test
   ```

### Copilot Configuration

1. **Clear Copilot History**
   - Press `Ctrl+Shift+P`
   - Type "Copilot"
   - Select "GitHub Copilot: Clear All Application Storage"

2. **Reset Copilot Context**
   - Close and reopen the file
   - Or add this comment at the top of your test file:
   ```typescript
   /**
   * @resetCopilotContext
   */
   ```

3. **Copilot Settings**
   In `settings.json`:
   ```json
   {
     "github.copilot.enable": {
       "*": true,
       "plaintext": false,
       "markdown": true,
       "typescript": true
     }
   }
   ```

## Test History Management

### Clear Test History
1. **Remove Test Results**
   ```powershell
   Remove-Item "test-results" -Recurse -Force
   Remove-Item "playwright-report" -Recurse -Force
   ```

2. **Clear Playwright Traces**
   ```powershell
   Remove-Item "trace.zip" -Force
   Remove-Item "trace.playwright" -Force
   ```

3. **Reset Test State**
   ```powershell
   npm clean-install
   npx playwright install
   ```

### Test Reports Management
1. **Generate HTML Report**
   ```powershell
   npx playwright show-report
   ```

2. **Save Report with Timestamp**
   ```powershell
   $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
   Copy-Item "playwright-report" -Destination "playwright-report_$timestamp" -Recurse
   ```

## Additional Tools & Extensions

### VS Code Extensions
1. **GitHub Extensions**
   - GitHub Pull Requests and Issues
   - GitLens
   - GitHub Copilot
   - GitHub Copilot Labs

2. **Testing Extensions**
   - Test Explorer UI
   - Playwright Test for VS Code
   - JavaScript and TypeScript Nightly

### Useful VS Code Settings
```json
{
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "playwright.reuseBrowser": false,
  "playwright.env": {
    "PWDEBUG": "1"
  },
  "github.copilot.chat.localeOverride": "en",
  "github.copilot.editor.enableAutoCompletions": true
}
```

## Performance Optimization

### Test Execution Speed
1. **Parallel Execution** (when needed)
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     workers: process.env.CI ? 1 : undefined,
     fullyParallel: true
   });
   ```

2. **Browser Instance Reuse**
   ```typescript
   let browser;
   test.beforeAll(async () => {
     browser = await chromium.launch();
   });
   test.afterAll(async () => {
     await browser?.close();
   });
   ```

### Memory Management
1. **Clear Browser Contexts**
   ```typescript
   test.afterEach(async ({ context }) => {
     await context.clearCookies();
     await context.clearPermissions();
   });
   ```

2. **Garbage Collection Hints**
   ```typescript
   test.afterEach(async () => {
     if (global.gc) global.gc();
   });
   ```

## Environment Variables
```powershell
# Debug Mode
$env:PWDEBUG=1

# Verbose Logs
$env:DEBUG="pw:api"

# Timeout Configuration
$env:PLAYWRIGHT_TIME=60000

# Skip Browser Downloads
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

## Common Error Messages & Solutions

1. **"No tests found"**
   - Check file path in `playwright.config.ts`
   - Verify test file naming pattern
   - Ensure proper test function syntax

2. **"Browser process exited"**
   - Try reinstalling browsers
   - Check system resources
   - Run with `--verbose` flag for more info

3. **"Element not found"**
   - Add `waitForSelector` before interactions
   - Check element selectors
   - Use `page.waitForLoadState('networkidle')`

## Testing Checklist

- [ ] Browsers installed correctly
- [ ] Configuration files in place
- [ ] Dependencies installed
- [ ] Test file follows naming convention
- [ ] Cache clearing implemented
- [ ] Error handling in place
- [ ] Cleanup code in `finally` block
- [ ] Browser visibility set correctly
- [ ] Sequential test execution configured
- [ ] Proper timeout values set

## Additional Resources

1. [Playwright Documentation](https://playwright.dev/docs/intro)
2. [TypeScript Documentation](https://www.typescriptlang.org/docs/)
3. [VS Code Playwright Extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
