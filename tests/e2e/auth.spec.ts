/**
 * Authentication E2E Tests
 * Tests login, logout, and session management
 */

import { test, expect } from '@playwright/test';
import { login, logout, isLoggedIn, TEST_USER } from './helpers/auth.helper';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies();
  });

  test.describe('Login Flow - Starting Logged Out', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to app (should show login page)
      await page.goto('/');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    });

    test('should display login form on initial load', async ({ page }) => {
      // Assert
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation for empty email', async ({ page }) => {
      // Act
      const emailInput = page.locator('input[type="email"]');
      await emailInput.click();
      await emailInput.blur();
      
      // Assert - check if validation message or disabled button
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test('should show validation for empty password', async ({ page }) => {
      // Act
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(TEST_USER.email);
      
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.click();
      await passwordInput.blur();
      
      // Assert
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test('should enable submit button when form is valid', async ({ page }) => {
      // Act
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await emailInput.click();
      await emailInput.type(TEST_USER.email, { delay: 50 });
      
      await passwordInput.click();
      await passwordInput.type(TEST_USER.password, { delay: 50 });
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Assert
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      // Act
      await login(page, TEST_USER);
      
      // Assert
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
      
      // Verify main app is loaded
      await expect(page.locator('h1:has-text("por.quinho")')).toBeVisible();
      await expect(page.locator('text=🐷 por.quinho')).toBeVisible();
    });

    test('should fail login with invalid credentials', async ({ page }) => {
      // Act
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await emailInput.click();
      await emailInput.type('invalid@example.com', { delay: 50 });
      
      await passwordInput.click();
      await passwordInput.type('wrongpassword', { delay: 50 });
      
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for error response
      await page.waitForTimeout(3000);
      
      // Should show error message or remain on login page
      await expect(page.locator('text=Erro no login')).toBeVisible();
    });
  });

  test.describe('Session Management - Starting Logged In', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test in this group
      await page.goto('/');
      await login(page, TEST_USER);
    });

    test('should maintain session after page refresh', async ({ page }) => {
      // Act
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Assert
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
      await expect(page.locator('text=🐷 por.quinho')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Act
      await logout(page);
      
      // Assert
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(false);
      
      // Should be back on login page
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('should redirect to main app when already logged in', async ({ page }) => {
      // Act - try to navigate to login page again
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Assert - should still be in the app
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);
    });
  });
});

