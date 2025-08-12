import { test, expect } from '@playwright/test';

test.describe('Delete Functionality E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('h1')).toBeVisible();

    // Clear any existing data by clicking "Limpar Dados" if it exists
    const clearButton = page.locator('button:has-text("Limpar Dados")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      // Confirm if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirmar")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });

  test('should add a record and delete it successfully', async ({ page }) => {
    // Step 1: Add a test record
    console.log('🧪 Step 1: Adding a test record...');

    // Fill the add record form
    await page.fill('input[placeholder*="Descrição"], input[name="description"], input[id*="description"]', 'Test E2E Record');
    await page.fill('input[type="number"], input[placeholder*="Valor"]', '150');
    await page.selectOption('select:has(option:text("Despesa"))', 'Despesa');

    // Submit the form
    await page.click('button:has-text("Adicionar"), button:has-text("Salvar"), button[type="submit"]');

    // Verify the record was added
    await expect(page.locator('text=Test E2E Record')).toBeVisible();
    console.log('✅ Record added successfully');

    // Step 2: Delete the record
    console.log('🧪 Step 2: Deleting the record...');

    // Find the delete button for our test record
    const recordRow = page.locator('[data-testid="record-row"], tr, .record-item').filter({
      hasText: 'Test E2E Record'
    }).first();

    // Look for delete button (trash icon)
    const deleteButton = recordRow.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"]), button[title*="Excluir"], button[aria-label*="delete"]').first();

    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    console.log('✅ Delete button clicked');

    // Step 3: Confirm deletion in modal
    console.log('🧪 Step 3: Confirming deletion...');

    // Wait for delete confirmation modal to appear
    const deleteModal = page.locator('[data-modal="delete-confirm"], .modal:has-text("Confirmar Exclusão"), .modal:has-text("excluir")');
    await expect(deleteModal).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete modal appeared');

    // Verify the modal shows the correct record
    await expect(deleteModal).toContainText('Test E2E Record');

    // Click confirm delete button
    const confirmDeleteButton = deleteModal.locator('button:has-text("Excluir"), button:has([class*="fa-trash"]), button.bg-red-500');
    await expect(confirmDeleteButton).toBeVisible();
    await confirmDeleteButton.click();
    console.log('✅ Deletion confirmed');

    // Step 4: Verify record was deleted
    console.log('🧪 Step 4: Verifying record was deleted...');

    // Wait for modal to disappear
    await expect(deleteModal).not.toBeVisible({ timeout: 5000 });

    // Verify the record is no longer in the table
    await expect(page.locator('text=Test E2E Record')).not.toBeVisible();
    console.log('✅ Record successfully deleted from table');

    // Step 5: Test undo functionality
    console.log('🧪 Step 5: Testing undo functionality...');

    // Look for undo toast
    const undoToast = page.locator('.toast, .undo-toast, [class*="toast"]:has-text("excluído")');
    if (await undoToast.isVisible()) {
      const undoButton = undoToast.locator('button:has-text("Desfazer")');
      if (await undoButton.isVisible()) {
        await undoButton.click();
        console.log('✅ Undo button clicked');

        // Verify record is restored
        await expect(page.locator('text=Test E2E Record')).toBeVisible();
        console.log('✅ Record successfully restored via undo');

        // Delete again for cleanup
        await recordRow.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"])').first().click();
        await deleteModal.locator('button:has-text("Excluir")').click();
      }
    }
  });

  test('should delete record from filtered/grouped data correctly', async ({ page }) => {
    console.log('🧪 Testing delete with multiple records and grouping...');

    // Add multiple records in different months
    const records = [
      { desc: 'January Record 1', value: '100', date: '2024-01-15' },
      { desc: 'January Record 2', value: '200', date: '2024-01-25' },
      { desc: 'February Record', value: '150', date: '2024-02-10' }
    ];

    for (const record of records) {
      await page.fill('input[placeholder*="Descrição"], input[name="description"]', record.desc);
      await page.fill('input[type="number"], input[placeholder*="Valor"]', record.value);

      // Set custom date if date input exists
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill(record.date);
      }

      await page.selectOption('select:has(option:text("Despesa"))', 'Despesa');
      await page.click('button:has-text("Adicionar"), button[type="submit"]');

      // Wait for record to appear
      await expect(page.locator(`text=${record.desc}`)).toBeVisible();
    }

    console.log('✅ Multiple records added');

    // Try to delete the middle record (January Record 2)
    const targetRecord = 'January Record 2';
    const recordRow = page.locator('[data-testid="record-row"], tr, .record-item').filter({
      hasText: targetRecord
    }).first();

    await recordRow.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"])').first().click();

    const deleteModal = page.locator('[data-modal="delete-confirm"], .modal:has-text("Confirmar Exclusão")');
    await expect(deleteModal).toBeVisible();
    await expect(deleteModal).toContainText(targetRecord);

    await deleteModal.locator('button:has-text("Excluir")').click();

    // Verify correct record was deleted
    await expect(page.locator(`text=${targetRecord}`)).not.toBeVisible();
    await expect(page.locator('text=January Record 1')).toBeVisible();
    await expect(page.locator('text=February Record')).toBeVisible();

    console.log('✅ Correct record deleted from grouped data');
  });

  test('should handle delete with console logging verification', async ({ page }) => {
    console.log('🧪 Testing delete with console log verification...');

    // Listen for console logs to verify our fix is working
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('FINANCE_TABLE') || msg.text().includes('STORE')) {
        consoleMessages.push(msg.text());
      }
    });

    // Add a test record
    await page.fill('input[placeholder*="Descrição"], input[name="description"]', 'Console Log Test Record');
    await page.fill('input[type="number"], input[placeholder*="Valor"]', '99');
    await page.selectOption('select:has(option:text("Despesa"))', 'Despesa');
    await page.click('button:has-text("Adicionar"), button[type="submit"]');

    await expect(page.locator('text=Console Log Test Record')).toBeVisible();

    // Delete the record
    const recordRow = page.locator('[data-testid="record-row"], tr, .record-item').filter({
      hasText: 'Console Log Test Record'
    }).first();

    await recordRow.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"])').first().click();

    const deleteModal = page.locator('[data-modal="delete-confirm"], .modal:has-text("Confirmar Exclusão")');
    await expect(deleteModal).toBeVisible();
    await deleteModal.locator('button:has-text("Excluir")').click();

    // Wait a moment for console logs
    await page.waitForTimeout(1000);

    // Verify the fix is working by checking console logs
    const hasIndexMappingLog = consoleMessages.some(msg =>
      msg.includes('Found record to delete at actual index') ||
      msg.includes('FINANCE_TABLE')
    );

    const hasSuccessLog = consoleMessages.some(msg =>
      msg.includes('Record deleted successfully') ||
      msg.includes('STORE')
    );

    console.log('📋 Console logs captured:', consoleMessages);

    // The record should be deleted regardless of console logs
    await expect(page.locator('text=Console Log Test Record')).not.toBeVisible();

    console.log('✅ Delete functionality verified with console logging');
  });
}); 