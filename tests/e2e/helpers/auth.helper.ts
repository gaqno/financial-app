/**
 * Authentication Helper for E2E Tests
 * Provides utilities for login, logout, and session management
 */

import { Page } from '@playwright/test';
import { TEST_USER, TEST_CONFIG, type TestUser } from '../../shared/constants';

/**
 * Login helper - handles the full login flow
 */
export async function login(page: Page, user: TestUser = TEST_USER): Promise<void> {
  await page.goto('/');
  
  // Wait for login page to load
  await page.waitForSelector(TEST_CONFIG.SELECTORS.EMAIL_INPUT, { timeout: 10000 });
  
  // Get input selectors
  const emailInput = page.locator(TEST_CONFIG.SELECTORS.EMAIL_INPUT);
  const passwordInput = page.locator(TEST_CONFIG.SELECTORS.PASSWORD_INPUT);
  
  // Type credentials with delay to trigger all Vue events properly
  await emailInput.click();
  await emailInput.type(user.email, { delay: 50 });
  
  await passwordInput.click();
  await passwordInput.type(user.password, { delay: 50 });
  
  // Wait for Vue to update the form validation
  await page.waitForTimeout(TEST_CONFIG.FORM_VALIDATION_DELAY);
  
  // Wait for submit button to be enabled
  const submitButton = page.locator(TEST_CONFIG.SELECTORS.SUBMIT_BUTTON);
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Wait until button is enabled
  await page.waitForTimeout(TEST_CONFIG.SHEET_ANIMATION_DELAY);
  
  // Click submit
  await submitButton.click();
  
  // Wait for successful login and main app to load
  await page.waitForTimeout(5000);
  await page.waitForSelector(TEST_CONFIG.SELECTORS.APP_TITLE, { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Open user menu (third button in the header user section)
  await page.getByRole('button', { name: '' }).nth(2).click();
  
  // Wait for menu to open
  await page.waitForTimeout(300);
  
  await page.waitForSelector('button[data-testid="user-menu-toggle"]', { timeout: 5000 })
  await page.waitForTimeout(300);

  await page.getByRole('button', { name: ' Sair' }).click();
  await page.waitForTimeout(300);
}

/**
 * Navigate to Transactions tab
 */
export async function navigateToTransactions(page: Page): Promise<void> {
  // Wait for navigation tabs to be ready
  await page.waitForSelector('button:has-text("Transações")', { timeout: 10000 });
  
  // Check if already on transactions tab (active tab has border-blue-500 class)
  const transactionButton = page.locator('button:has-text("Transações")');
  const isActive = await transactionButton.evaluate(el => 
    el.classList.contains('border-blue-500') || el.classList.contains('text-blue-600')
  ).catch(() => false);
  
  if (!isActive) {
    // Click to navigate to transactions
    await transactionButton.click();
    await page.waitForTimeout(500); // Wait for tab switch animation
  }
  
  // Wait for the finance table content to be visible
  await page.waitForSelector('text=💰', { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('h1:has-text("por.quinho")', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup authenticated page - handles login if needed
 */
export async function setupAuthenticatedPage(page: Page): Promise<void> {
  await page.goto('/');
  
  const loggedIn = await isLoggedIn(page);
  
  if (!loggedIn) {
    await login(page);
  }
  
  // Ensure we're on the transactions tab
  await navigateToTransactions(page);
}

// Re-export shared types and constants for convenience
export { TEST_USER, TEST_CONFIG, type TestUser };

