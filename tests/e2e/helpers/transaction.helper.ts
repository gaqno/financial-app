/**
 * Transaction Helper for E2E Tests
 * Provides utilities for interacting with transactions
 */

import { Page, expect } from '@playwright/test';
import type { TransactionData } from '../../shared/types';

// Extended TransactionData for E2E with recurrence options
export interface E2ETransactionData extends TransactionData {
  recurrence?: {
    frequency: 'semanal' | 'quinzenal' | 'mensal' | 'trimestral';
    endDate: string;
  };
}

/**
 * Open create transaction sheet
 */
export async function openCreateSheet(page: Page): Promise<void> {
  // Try desktop button first
  const desktopButton = page.locator('button:has-text("Novo Registro")');
  const desktopVisible = await desktopButton.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (desktopVisible) {
    await desktopButton.click();
  } else {
    // Use mobile FAB
    await page.click('[data-testid="fab-button"]');
    await page.click('button:has-text("Novo Registro")');
  }
  
  // Wait for sheet to open (h2 or h3)
  await page.waitForSelector('h2:has-text("Novo Registro"), h3:has-text("Novo Registro")', { timeout: 5000 });
  await page.waitForTimeout(500); // Wait for sheet animation
}

/**
 * Fill transaction form
 * Based on actual form structure from browser inspection
 */
export async function fillTransactionForm(
  page: Page,
  data: E2ETransactionData
): Promise<void> {
  // Wait for form to be fully loaded
  await page.waitForTimeout(500);
  
  // Date - textbox in "Data da Transação" section
  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.fill(data.date);
  await page.waitForTimeout(300);
  
  // Description - textbox in "Descrição" section
  const descInput = page.getByRole('textbox').nth(1); // Second textbox (first is date)
  await descInput.click();
  await descInput.fill(data.description);
  await page.waitForTimeout(300);
  
  // Value - textbox with placeholder "R$ 0,00"
  // Currency input expects just the numeric value (e.g., "500" for R$ 500,00)
  const valueInput = page.getByRole('textbox', { name: 'R$ 0,00' });
  await valueInput.click();
  await valueInput.clear();
  // Just use the raw value - the UI handles currency formatting
  const valueStr = Math.abs(data.value).toString();
  await valueInput.type(valueStr, { delay: 100 });
  await page.waitForTimeout(500);
  
  // Type - combobox for "Tipo"
  const typeSelect = page.getByRole('combobox').first();
  await typeSelect.selectOption({ label: data.type === 'Receita' ? '💰 Receita' : '💸 Despesa' });
  await page.waitForTimeout(300);
  
  // Category (if provided) - combobox for "Categoria"
  if (data.category) {
    const categorySelect = page.getByRole('combobox').nth(1);
    await categorySelect.selectOption({ label: data.category });
    await page.waitForTimeout(300);
  }
  
  // Status - combobox for "Status"
  const statusSelect = page.getByRole('combobox').nth(2);
  const statusLabel = data.status === '✔️' ? '✔️ Confirmado' : '❌ Pendente';
  await statusSelect.selectOption({ label: statusLabel });
  await page.waitForTimeout(300);
  
  // Recurrence (if provided)
  if (data.recurrence) {
    // Toggle recurrence checkbox - use the one inside main content, not the dark mode toggle
    const recurrenceCheckbox = page.getByRole('main').getByRole('checkbox');
    await recurrenceCheckbox.check();
    await page.waitForTimeout(500); // Wait for recurrence form to appear
    
    // Select frequency - this is a combobox that appears after checking the checkbox
    // From the UI inspection, it's the 4th combobox (Tipo=0, Categoria=1, Status=2, Frequência=3)
    const frequencySelect = page.getByRole('combobox').nth(3);
    const frequencyMap = {
      'semanal': 'Semanal',
      'quinzenal': 'Quinzenal', 
      'mensal': 'Mensal',
      'trimestral': 'Trimestral'
    };
    await frequencySelect.selectOption({ label: frequencyMap[data.recurrence.frequency] });
    await page.waitForTimeout(300);
    
    // Set end date - this is the 4th textbox (Date=0, Descrição=1, Valor=2, Data Final=3)
    const endDateInput = page.getByRole('textbox').nth(3);
    await endDateInput.fill(data.recurrence.endDate);
    await page.waitForTimeout(300);
  }
}

/**
 * Submit transaction form
 */
export async function submitTransaction(page: Page): Promise<void> {
  await page.click('button:has-text("Criar")');
  
  // Wait for sheet to close
  await page.waitForSelector('h3:has-text("Novo Registro")', { 
    state: 'hidden',
    timeout: 5000 
  });
}

/**
 * Create a complete transaction
 */
export async function createTransaction(
  page: Page,
  data: E2ETransactionData
): Promise<void> {
  await openCreateSheet(page);
  await fillTransactionForm(page, data);
  await submitTransaction(page);
  
  // Wait for transaction to appear in the list
  await page.waitForSelector(`text=${data.description}`, { timeout: 5000 });
}

/**
 * Edit transaction
 */
export async function editTransaction(
  page: Page,
  description: string,
  updates: Partial<E2ETransactionData>
): Promise<void> {
  // Find the transaction row (use .first() to handle duplicates)
  const row = page.locator(`tr:has-text("${description}")`).first();
  
  // Click edit button
  await row.locator('button[title="Editar registro"], button:has(i.fa-edit)').first().click();
  
  // Wait for edit sheet
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { timeout: 5000 });
  await page.waitForTimeout(500); // Wait for form to load
  
  // Apply updates
  if (updates.description) {
    const descInput = page.getByRole('textbox').nth(1);
    await descInput.clear();
    await descInput.fill(updates.description);
    await page.waitForTimeout(300);
  }
  
  if (updates.value !== undefined) {
    const valueInput = page.getByRole('textbox', { name: 'R$ 0,00' });
    await valueInput.clear();
    // Just use the raw value - the UI handles currency formatting
    const valueStr = Math.abs(updates.value).toString();
    await valueInput.type(valueStr, { delay: 100 });
    await page.waitForTimeout(300);
  }
  
  if (updates.type) {
    const typeSelect = page.getByRole('combobox').first();
    await typeSelect.selectOption({ label: updates.type === 'Receita' ? '💰 Receita' : '💸 Despesa' });
    await page.waitForTimeout(300);
  }
  
  if (updates.status) {
    const statusSelect = page.getByRole('combobox').nth(2);
    const statusLabel = updates.status === '✔️' ? '✔️ Confirmado' : '❌ Pendente';
    await statusSelect.selectOption({ label: statusLabel });
    await page.waitForTimeout(300);
  }
  
  // Submit
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForTimeout(500);
  
  // Wait for sheet to close
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { 
    state: 'hidden',
    timeout: 5000 
  });
}

/**
 * Delete transaction
 */
export async function deleteTransaction(
  page: Page,
  description: string,
  confirm: boolean = true
): Promise<void> {
  // Find the transaction row (use .first() to handle duplicates)
  const row = page.locator(`tr:has-text("${description}")`).first();
  
  // Click delete button
  await row.locator('button[title="Deletar registro"], button:has(i.fa-trash)').first().click();
  
  // Wait for confirmation modal
  await page.waitForTimeout(500);
  await page.waitForSelector('text=Confirmar exclusão', { timeout: 5000 });
  
  if (confirm) {
    // Try different button texts
    const confirmButton = page.getByRole('button', { name: /Confirmar|Deletar|Excluir/i });
    await confirmButton.click();
    
    // Wait for undo toast or deletion
    await page.waitForTimeout(1000);
  } else {
    await page.getByRole('button', { name: 'Cancelar' }).click();
  }
}

/**
 * Toggle transaction status
 */
export async function toggleTransactionStatus(
  page: Page,
  description: string
): Promise<void> {
  const row = page.locator(`tr:has-text("${description}")`);
  await row.locator('[data-testid="status-toggle"]').click();
}

/**
 * Verify transaction exists
 */
export async function verifyTransactionExists(
  page: Page,
  description: string
): Promise<void> {
  await expect(page.locator(`text=${description}`).first()).toBeVisible({ timeout: 5000 });
}

/**
 * Verify transaction does not exist
 * Note: Due to undo feature and duplicate views (mobile/desktop), we check count instead of visibility
 */
export async function verifyTransactionNotExists(
  page: Page,
  description: string
): Promise<void> {
  // Wait a bit for the deletion to process
  await page.waitForTimeout(1500);
  
  // Count visible instances - should be 0 or minimal after deletion
  // We use a more lenient check since undo toast may keep some text visible temporarily
  const count = await page.locator(`text=${description}`).count();
  
  // If still visible, it might be in undo toast, so just verify it's not in the transaction table
  if (count > 0) {
    const tableRows = await page.locator(`tr:has-text("${description}")`).count();
    expect(tableRows).toBe(0);
  }
}

/**
 * Get balance value
 */
export async function getBalance(page: Page): Promise<number> {
  const balanceText = await page.locator('text=/Saldo:|Carteira:/ + span').innerText();
  const balance = parseFloat(balanceText.replace(/[^0-9,-]/g, '').replace(',', '.'));
  return balance;
}

/**
 * Apply filters
 */
export async function applyFilter(
  page: Page,
  filterType: 'all' | 'Receita' | 'Despesa'
): Promise<void> {
  await page.click(`button:has-text("${filterType}")`);
}

/**
 * Search/filter by category
 */
export async function filterByCategory(
  page: Page,
  category: string
): Promise<void> {
  await page.fill('input[placeholder*="Categoria"]', category);
}

/**
 * Undo deletion
 */
export async function undoDeletion(page: Page): Promise<void> {
  await page.click('button:has-text("Desfazer")');
  await page.waitForSelector('text=Registro excluído', { state: 'hidden', timeout: 5000 });
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="loading-spinner"]', { 
    state: 'hidden',
    timeout: 10000 
  }).catch(() => {
    // Loading spinner might not appear for fast operations
  });
}

/**
 * Create recurring transaction
 */
export async function createRecurringTransaction(
  page: Page,
  data: E2ETransactionData,
  recurrence: { frequency: 'semanal' | 'quinzenal' | 'mensal' | 'trimestral', endDate: string }
): Promise<void> {
  const recurringData = { ...data, recurrence };
  await createTransaction(page, recurringData);
}

/**
 * Verify recurring transaction indicators
 */
export async function verifyRecurringIndicators(
  page: Page,
  description: string
): Promise<void> {
  const row = page.locator(`tr:has-text("${description}")`).first();
  
  // Try multiple approaches to find recurrence indicators
  const indicators = [
    row.locator('[title*="recorr"]'),
    row.locator('[aria-label*="recorr"]'), 
    row.locator('text=/🔄/'),
    row.locator('text=/recorr/i'),
    row.locator('text=/mensal|semanal|trimestral/i')
  ];
  
  let found = false;
  for (const indicator of indicators) {
    try {
      await expect(indicator).toBeVisible({ timeout: 1000 });
      found = true;
      break;
    } catch {
      // Continue to next indicator
    }
  }
  
  // If no specific indicators found, just verify multiple instances exist
  // (which indicates it's a recurring transaction)
  if (!found) {
    const count = await page.locator(`tr:has-text("${description}")`).count();
    expect(count).toBeGreaterThan(1);
  }
}

/**
 * Count recurring transaction instances from current month forward
 */
export async function countRecurringInstances(
  page: Page,
  description: string
): Promise<number> {
  await page.waitForTimeout(1000);
  
  // Get current date to filter from current month forward
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based
  
  // Get all rows with the description
  const rows = page.locator(`tr:has-text("${description}")`);
  const count = await rows.count();
  
  let futureCount = 0;
  
  // Check each row to see if it's in current month or future
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const dateCell = row.locator('td').first(); // First cell should be date
    const dateText = await dateCell.textContent();
    
    if (dateText) {
      // Parse date in DD/MM/YYYY format
      const dateParts = dateText.trim().split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Convert to 0-based
        const year = parseInt(dateParts[2]);
        
        const transactionDate = new Date(year, month, day);
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        
        // Count if transaction is in current month or future
        if (transactionDate >= currentMonthStart) {
          futureCount++;
        }
      }
    }
  }
  
  return futureCount;
}

/**
 * Edit recurring transaction with choice (single or all)
 */
export async function editRecurringTransaction(
  page: Page,
  description: string,
  updates: Partial<E2ETransactionData>,
  editChoice: 'single' | 'all' = 'single'
): Promise<void> {
  // Find the transaction row
  const row = page.locator(`tr:has-text("${description}")`).first();
  
  // Click edit button
  await row.locator('button[title="Editar registro"], button:has(i.fa-edit)').first().click();
  
  // Wait for edit sheet
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { timeout: 5000 });
  await page.waitForTimeout(500);
  
  // Check if recurrence choice dialog appears
  const choiceDialog = page.locator('text=/editar apenas|editar todos|single|all/i');
  const hasChoice = await choiceDialog.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (hasChoice) {
    if (editChoice === 'all') {
      await page.click('button:has-text("Todos")');
    } else {
      await page.click('button:has-text("Apenas Este")');
    }
    await page.waitForTimeout(500);
  }
  
  // Apply updates (similar to regular edit)
  if (updates.description) {
    const descInput = page.getByRole('textbox').nth(1);
    await descInput.clear();
    await descInput.fill(updates.description);
    await page.waitForTimeout(300);
  }
  
  if (updates.value !== undefined) {
    const valueInput = page.getByRole('textbox', { name: 'R$ 0,00' });
    await valueInput.clear();
    // Just use the raw value - the UI handles currency formatting
    const valueStr = Math.abs(updates.value).toString();
    await valueInput.type(valueStr, { delay: 100 });
    await page.waitForTimeout(300);
  }
  
  // Submit
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForTimeout(500);
  
  // Wait for sheet to close
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { 
    state: 'hidden',
    timeout: 5000 
  });
}

/**
 * Delete recurring transaction with choice (single or all)
 */
export async function deleteRecurringTransaction(
  page: Page,
  description: string,
  deleteChoice: 'single' | 'all' = 'all',
  confirm: boolean = true
): Promise<void> {
  // Find the transaction row
  const row = page.locator(`tr:has-text("${description}")`).first();
  
  // Click delete button
  await row.locator('button[title="Deletar registro"], button:has(i.fa-trash)').first().click();
  
  // Wait for choice dialog or confirmation modal
  await page.waitForTimeout(500);
  
  // Check if recurrence choice dialog appears
  const choiceDialog = page.locator('text=/deletar apenas|deletar todos|single|all/i');
  const hasChoice = await choiceDialog.isVisible({ timeout: 2000 }).catch(() => false);
  
  if (hasChoice) {
    if (deleteChoice === 'all') {
      await page.click('button:has-text("Todos")');
    } else {
      await page.click('button:has-text("Apenas Este")');
    }
    await page.waitForTimeout(500);
  }
  
  // Handle confirmation modal
  await page.waitForTimeout(500);
  
  if (confirm) {
    // Choose the appropriate deletion button based on deleteChoice
    if (deleteChoice === 'single') {
      const confirmButton = page.getByRole('button', { name: 'Excluir apenas este registro' });
      await confirmButton.click();
    } else {
      const confirmButton = page.getByRole('button', { name: 'Excluir TODA a série' });
      await confirmButton.click();
    }
    await page.waitForTimeout(1000);
  } else {
    await page.getByRole('button', { name: 'Cancelar' }).click();
  }
}

/**
 * Disable recurrence on existing transaction
 */
export async function disableRecurrence(
  page: Page,
  description: string
): Promise<void> {
  // Edit the transaction and uncheck recurrence
  const row = page.locator(`tr:has-text("${description}")`).first();
  await row.locator('button[title="Editar registro"], button:has(i.fa-edit)').first().click();
  
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { timeout: 5000 });
  await page.waitForTimeout(500);
  
  // Uncheck recurrence checkbox - use the one inside main content
  const recurrenceCheckbox = page.getByRole('main').getByRole('checkbox');
  await recurrenceCheckbox.uncheck();
  await page.waitForTimeout(300);
  
  // Submit
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.waitForTimeout(500);
  
  await page.waitForSelector('h2:has-text("Editar Registro"), h3:has-text("Editar Registro")', { 
    state: 'hidden',
    timeout: 5000 
  });
}

// Re-export shared types for convenience
export type { TransactionData } from '../../shared/types';

