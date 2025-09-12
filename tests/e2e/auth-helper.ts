import { Page, expect } from '@playwright/test';

export async function loginWithDemo(page: Page): Promise<void> {
  // Go to the app
  await page.goto('/');

  // Set larger viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Wait for page to load
  await expect(page.locator('body')).toBeVisible();

  // Look for and click demo credentials button to fill the form
  const demoButton = page.locator('button:has-text("Usar credenciais demo")');

  // Wait for demo button and click it
  await expect(demoButton).toBeVisible({ timeout: 10000 });
  await demoButton.click();

  // Wait a moment for form to be filled
  await page.waitForTimeout(1000);

  // Now click the actual login button
  const loginButton = page.locator('button:has-text("Entrar")');
  await expect(loginButton).toBeVisible({ timeout: 5000 });
  await loginButton.click();

  // Wait for authentication to complete and app to load
  // After successful login, we should no longer see the login form
  const loginForm = page.locator('button:has-text("Entrar")');
  await expect(loginForm).not.toBeVisible({ timeout: 15000 });

  // Wait for the main app to load - look for header or tabs
  const appElements = page.locator('header, nav, button:has-text("Transações")');
  await expect(appElements.first()).toBeVisible({ timeout: 10000 });

  // Wait a bit more for the app to stabilize
  await page.waitForTimeout(3000);
}

export async function waitForAppToLoad(page: Page): Promise<void> {
  // Wait for main app elements to be visible
  // The "Novo Registro" button or "+" button should be available when app is ready
  const addButton = page.locator('button:has-text("Novo Registro"), button:has-text("+")').first();

  try {
    await expect(addButton).toBeVisible({ timeout: 10000 });
  } catch {
    // If button not found, at least make sure the main title is there
    const financeAppTitle = page.locator('h1:has-text("FinanceApp")');
    await expect(financeAppTitle).toBeVisible();
  }
}

export async function openCreateModal(page: Page): Promise<void> {
  // Click add record button
  await clickAddRecordButton(page);

  // Wait for modal to open and form fields to be available
  const descriptionInput = page.locator('input').filter({ hasText: /descrição/i }).or(
    page.locator('input[placeholder*="Descrição"]')
  ).or(
    page.locator('input').nth(1) // Often the second input after date
  );

  await expect(descriptionInput).toBeVisible({ timeout: 5000 });
}

export async function clickAddRecordButton(page: Page): Promise<void> {
  // Try different selectors for the add record button
  const selectors = [
    'button:has-text("Novo Registro")',
    'button:has-text("+")',
    'button[class*="bg-blue-600"]:has(i.fa-plus-circle)',
    'button:has(i.fa-plus-circle)'
  ];

  for (const selector of selectors) {
    const button = page.locator(selector);
    if (await button.isVisible()) {
      await button.click();
      return;
    }
  }

  throw new Error('Add record button not found with any selector');
}

export async function fillTransactionForm(page: Page, transaction: {
  description: string;
  amount: string;
  type: 'Receita' | 'Despesa';
  category?: string;
  status?: '❌' | '✔️';
}): Promise<void> {
  // Fill description (input 2 - first text input)
  await page.fill('input[type="text"]', transaction.description);

  // Fill amount (input 3 - with R$ placeholder)
  await page.fill('input[placeholder="R$ 0,00"]', transaction.amount);

  // Select type (select 0)
  await page.selectOption('select >> nth=0', transaction.type);

  // Select category if provided (select 1)
  if (transaction.category) {
    await page.selectOption('select >> nth=1', transaction.category);
  }

  // Select status if provided (select 2)
  if (transaction.status) {
    await page.selectOption('select >> nth=2', transaction.status);
  }
}

export async function submitCreateForm(page: Page): Promise<void> {
  await page.click('button:has-text("Criar")');
  await page.waitForTimeout(2000); // Wait for creation to complete
}

export async function submitEditForm(page: Page): Promise<void> {
  await page.click('button:has-text("Salvar")');
  await page.waitForTimeout(2000); // Wait for edit to complete
}

export async function enableRecurrence(page: Page, frequency: 'semanal' | 'quinzenal' | 'mensal' | 'trimestral', endDate?: string): Promise<void> {
  // Check the recurrence checkbox
  await page.check('input[type="checkbox"]');

  // Wait for recurrence options to appear
  await page.waitForTimeout(500);

  // Select frequency - based on debug, it's select 3 (4th select)
  const frequencyMap = {
    'semanal': 'Semanal',
    'quinzenal': 'Quinzenal',
    'mensal': 'Mensal',
    'trimestral': 'Trimestral'
  };

  await page.selectOption('select >> nth=3', frequencyMap[frequency]);

  // Set end date if provided
  if (endDate) {
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(1).fill(endDate); // Second date input is end date
  }
}
