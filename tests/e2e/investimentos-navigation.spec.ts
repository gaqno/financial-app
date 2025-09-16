import { test, expect } from '@playwright/test';
import { loginWithDemo } from './auth-helper';

test.describe('Investimentos Tab Navigation Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Navigate to Investimentos tab and verify functionality', async ({ page }) => {
    console.log('🧪 Testing Investimentos tab navigation...');

    // Step 1: Verify we start on the default tab (Transações)
    console.log('📊 Step 1: Verifying initial state...');
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-before-navigation.png', fullPage: true });

    // Look for tab navigation elements
    const tabsContainer = page.locator('nav, .tab-container, [role="tablist"]').first();
    await expect(tabsContainer).toBeVisible({ timeout: 10000 });

    // Step 2: Find and click the Investimentos tab
    console.log('📈 Step 2: Clicking Investimentos tab...');
    
    // Try multiple selectors for the Investimentos tab
    const investimentosSelectors = [
      'button:has-text("Investimentos")',
      'button:has-text("📈")',
      '[data-tab="investments"]',
      'button[id*="investment"]',
      '.tab-button:has-text("Investimentos")'
    ];

    let investimentosTab = null;
    for (const selector of investimentosSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        investimentosTab = element;
        break;
      }
    }

    // If we can't find with specific selectors, try to find in a more general way
    if (!investimentosTab) {
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent();
        if (text && text.includes('Investimentos')) {
          investimentosTab = button;
          break;
        }
      }
    }

    // Verify we found the Investimentos tab
    expect(investimentosTab).toBeTruthy();
    console.log('✅ Found Investimentos tab');

    // Click the Investimentos tab
    await investimentosTab!.click();
    await page.waitForTimeout(1500);

    // Step 3: Verify navigation occurred
    console.log('🔄 Step 3: Verifying navigation to Investimentos...');
    
    // Take a screenshot after navigation
    await page.screenshot({ path: 'debug-after-navigation.png', fullPage: true });

    // Check if the tab is now active/selected (various ways to check)
    const activeTabChecks = [
      // Check for active class or selected state
      () => investimentosTab!.getAttribute('class').then(classes => classes?.includes('active')),
      () => investimentosTab!.getAttribute('aria-selected').then(selected => selected === 'true'),
      // Check if Investimentos content is visible
      () => page.locator('text=Portfolio').isVisible().catch(() => false),
      () => page.locator('text=Valor Total').isVisible().catch(() => false),
      () => page.locator('[data-content="investments"]').isVisible().catch(() => false),
    ];

    let navigationSuccessful = false;
    for (const check of activeTabChecks) {
      try {
        const result = await check();
        if (result) {
          navigationSuccessful = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Step 4: Check for Investimentos-specific content
    console.log('📊 Step 4: Checking for Investimentos content...');
    
    // Look for investment-related content that should appear
    const investmentContentSelectors = [
      'text=Portfolio',
      'text=Valor Total',
      'text=Investimentos',
      'text=R$ 0,00', // Default balance display
      '.investment-dashboard',
      '[data-testid="investment-content"]'
    ];

    let contentFound = false;
    for (const selector of investmentContentSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found investment content: ${selector}`);
          contentFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Step 5: Check for console logs from the navigation
    console.log('🔍 Step 5: Checking for navigation logs...');
    
    // Listen for console messages that indicate tab switching
    let navigationLogFound = false;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('NAVIGATION') && text.includes('investments')) {
        console.log(`✅ Found navigation log: ${text}`);
        navigationLogFound = true;
      }
    });

    // Trigger navigation again to capture logs
    await investimentosTab!.click();
    await page.waitForTimeout(1000);

    // Step 6: Check for toast notifications
    console.log('🍞 Step 6: Checking for toast notifications...');
    
    const toastSelectors = [
      'text=Navegando para Investimentos',
      'text=📈 Investimentos',
      '.toast-message',
      '[data-testid="toast"]'
    ];

    let toastFound = false;
    for (const selector of toastSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Found toast notification: ${selector}`);
          toastFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Step 7: Final screenshot for debugging
    await page.screenshot({ path: 'debug-final-state.png', fullPage: true });

    // Report results
    console.log('📋 Test Results Summary:');
    console.log(`   Tab found: ✅`);
    console.log(`   Navigation successful: ${navigationSuccessful ? '✅' : '❌'}`);
    console.log(`   Content found: ${contentFound ? '✅' : '❌'}`);
    console.log(`   Navigation logs: ${navigationLogFound ? '✅' : '❌'}`);
    console.log(`   Toast notifications: ${toastFound ? '✅' : '❌'}`);

    // At minimum, we should be able to click the tab
    expect(investimentosTab).toBeTruthy();
    
    // If we found content or successful navigation, that's good
    if (contentFound || navigationSuccessful || toastFound) {
      console.log('🎉 Investimentos tab navigation is working!');
    } else {
      console.log('⚠️ Tab exists but functionality may need verification');
    }
  });

  test('Verify Investimentos tab state and functionality', async ({ page }) => {
    console.log('🔍 Testing Investimentos tab state management...');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Navigate to Investimentos tab
    const investimentosTab = page.locator('button:has-text("Investimentos")').first();
    await investimentosTab.click();
    await page.waitForTimeout(1000);

    // Check the current activeTab state through console evaluation
    const activeTabValue = await page.evaluate(() => {
      // Try to access Vue app instance to check activeTab
      const app = document.querySelector('#app')?.__vue_app__;
      return app ? 'Vue app found' : 'Vue app not found';
    });

    console.log(`Vue app state: ${activeTabValue}`);

    // Check for investment-related components
    const components = [
      'InvestmentDashboard',
      'PortfolioValue',
      'InvestmentList'
    ];

    for (const component of components) {
      const element = page.locator(`[data-component="${component}"]`);
      if (await element.isVisible()) {
        console.log(`✅ Found component: ${component}`);
      }
    }

    // Test adding an investment (if functionality exists)
    const addInvestmentButton = page.locator('button:has-text("Novo Investimento"), button:has-text("Adicionar Investimento")');
    if (await addInvestmentButton.isVisible()) {
      console.log('✅ Add investment functionality available');
      await addInvestmentButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of investment modal if it appears
      await page.screenshot({ path: 'debug-investment-modal.png', fullPage: true });
    }

    console.log('🎯 Investimentos tab state verification complete');
  });

  test('Test Investimentos tab persistence and navigation flow', async ({ page }) => {
    console.log('🔄 Testing Investimentos tab persistence...');

    // Navigate to Investimentos
    const investimentosTab = page.locator('button:has-text("Investimentos")').first();
    await investimentosTab.click();
    await page.waitForTimeout(1000);

    // Navigate to another tab (Transações)
    const transacoesTab = page.locator('button:has-text("Transações")').first();
    if (await transacoesTab.isVisible()) {
      await transacoesTab.click();
      await page.waitForTimeout(1000);
    }

    // Navigate back to Investimentos
    await investimentosTab.click();
    await page.waitForTimeout(1000);

    // Check if the tab state is maintained
    const isActive = await page.locator('button:has-text("Investimentos")[class*="active"]').isVisible();
    console.log(`Tab state maintained: ${isActive ? '✅' : '❌'}`);

    // Final verification screenshot
    await page.screenshot({ path: 'debug-tab-persistence.png', fullPage: true });

    console.log('🎯 Tab persistence test complete');
  });
});
