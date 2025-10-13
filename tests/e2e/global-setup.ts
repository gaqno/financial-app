/**
 * Global Setup for E2E Tests
 * Authenticates once and saves the session state
 * This significantly speeds up test execution
 */

import { chromium, FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import { TEST_USER, TEST_CONFIG } from '../shared/constants';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🔐 Performing global authentication...');
  
  try {
    // Navigate to app
    await page.goto(baseURL || 'http://localhost:5173');
    
    // Wait for login page
    await page.waitForSelector(TEST_CONFIG.SELECTORS.EMAIL_INPUT, { timeout: TEST_CONFIG.AUTH_TIMEOUT });
    
    // Fill login form
    const emailInput = page.locator(TEST_CONFIG.SELECTORS.EMAIL_INPUT);
    const passwordInput = page.locator(TEST_CONFIG.SELECTORS.PASSWORD_INPUT);
    
    await emailInput.click();
    await emailInput.type(TEST_USER.email, { delay: 50 });
    
    await passwordInput.click();
    await passwordInput.type(TEST_USER.password, { delay: 50 });
    
    // Wait for validation
    await page.waitForTimeout(TEST_CONFIG.FORM_VALIDATION_DELAY);
    
    // Submit
    const submitButton = page.locator(TEST_CONFIG.SELECTORS.SUBMIT_BUTTON);
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(TEST_CONFIG.SHEET_ANIMATION_DELAY);
    await submitButton.click();
    
    // Wait for successful login
    await page.waitForTimeout(5000);
    await page.waitForSelector(TEST_CONFIG.SELECTORS.APP_TITLE, { timeout: TEST_CONFIG.AUTH_TIMEOUT });
    
    console.log('✅ Authentication successful!');
    
    // Save authenticated state
    const storageStatePath = path.join(__dirname, '../../.auth/user.json');
    await page.context().storageState({ path: storageStatePath });
    
    console.log(`💾 Session saved to: ${storageStatePath}`);
    
  } catch (error) {
    console.error('❌ Global authentication failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

