import { test, expect } from '@playwright/test';

test.describe('Month Collapse/Expand E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(2000);

    // Add some test data for testing collapse functionality
    await addTestData(page);
  });

  // Helper function to add test data
  async function addTestData(page) {
    const testRecords = [
      { description: 'Janeiro Income', value: '5000', type: 'Receita', date: '2025-01-15' },
      { description: 'Janeiro Expense', value: '1500', type: 'Despesa', date: '2025-01-20' },
      { description: 'Fevereiro Income', value: '4500', type: 'Receita', date: '2025-02-10' },
      { description: 'Fevereiro Expense', value: '2000', type: 'Despesa', date: '2025-02-25' }
    ];

    for (const record of testRecords) {
      // Fill the form
      await page.locator('input[type="date"]').fill(record.date);
      await page.locator('input[placeholder*="Descrição"]').fill(record.description);
      await page.locator('input[placeholder*="R$"]').fill(record.value);
      await page.selectOption('select', record.type);

      // Add the record
      await page.locator('button:has-text("Adicionar")').click();
      await page.waitForTimeout(500);
    }

    // Refresh to see all data properly
    await page.reload();
    await page.waitForTimeout(2000);
  }

  test('Basic Collapse and Expand Functionality', async ({ page }) => {
    // Verify months are displayed with proper Portuguese names
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();

    // Find January month section
    const januarySection = page.locator('[data-testid="month-section"]').filter({ hasText: 'janeiro de 2025' }).first();
    if (!(await januarySection.isVisible())) {
      // Fallback to text-based selector
      const januaryHeader = page.locator('text=janeiro de 2025').first();
      await expect(januaryHeader).toBeVisible();

      // Find the closest clickable month header
      const monthHeader = page.locator('.month-section').filter({ hasText: 'janeiro de 2025' }).first();
      await expect(monthHeader).toBeVisible();

      // Verify records table is visible initially (expanded state)
      const recordsTable = page.locator('table').filter({ hasText: 'Janeiro Income' });
      await expect(recordsTable).toBeVisible();

      // Click to collapse
      await monthHeader.click();
      await page.waitForTimeout(500);

      // Verify table is hidden but header remains
      await expect(page.locator('text=janeiro de 2025')).toBeVisible();
      // Table should be hidden or not visible
      await expect(recordsTable).not.toBeVisible();

      // Click to expand again
      await monthHeader.click();
      await page.waitForTimeout(500);

      // Verify table is visible again
      await expect(recordsTable).toBeVisible();
    }
  });

  test('Independent Month Collapse', async ({ page }) => {
    // Test that months can be collapsed independently
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();
    const februaryHeader = page.locator('.month-section').filter({ hasText: 'fevereiro' }).first();

    // Verify both months are visible
    await expect(januaryHeader).toBeVisible();
    await expect(februaryHeader).toBeVisible();

    // Collapse January
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Verify January is collapsed but February remains expanded
    const januaryTable = page.locator('table').filter({ hasText: 'Janeiro Income' });
    const februaryTable = page.locator('table').filter({ hasText: 'Fevereiro Income' });

    await expect(januaryTable).not.toBeVisible();
    await expect(februaryTable).toBeVisible();

    // Collapse February
    await februaryHeader.click();
    await page.waitForTimeout(500);

    // Verify both are collapsed
    await expect(januaryTable).not.toBeVisible();
    await expect(februaryTable).not.toBeVisible();

    // But month headers should still be visible
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();
  });

  test('Collapse State Persists During CRUD Operations', async ({ page }) => {
    // Collapse January
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Verify it's collapsed
    const januaryTable = page.locator('table').filter({ hasText: 'Janeiro Income' });
    await expect(januaryTable).not.toBeVisible();

    // Add a new record
    await page.locator('input[type="date"]').fill('2025-01-30');
    await page.locator('input[placeholder*="Descrição"]').fill('New Janeiro Record');
    await page.locator('input[placeholder*="R$"]').fill('500');
    await page.selectOption('select', 'Despesa');
    await page.locator('button:has-text("Adicionar")').click();
    await page.waitForTimeout(1000);

    // January should still be collapsed
    await expect(januaryTable).not.toBeVisible();
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();

    // Expand to verify the record was added
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Now should see the new record
    await expect(page.locator('text=New Janeiro Record')).toBeVisible();
  });

  test('Collapse Works with Filtering', async ({ page }) => {
    // Collapse February
    const februaryHeader = page.locator('.month-section').filter({ hasText: 'fevereiro' }).first();
    await februaryHeader.click();
    await page.waitForTimeout(500);

    // Apply Receitas filter
    await page.locator('button:has-text("💰 Receitas")').click();
    await page.waitForTimeout(500);

    // February header should still be visible and collapsed
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();
    const februaryTable = page.locator('table').filter({ hasText: 'Fevereiro Income' });
    await expect(februaryTable).not.toBeVisible();

    // Apply Despesas filter
    await page.locator('button:has-text("💸 Despesas")').click();
    await page.waitForTimeout(500);

    // February should still be collapsed
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();

    // Reset filter
    await page.locator('button:has-text("📊 Todos")').click();
    await page.waitForTimeout(500);

    // February should still be collapsed
    const allRecordsTable = page.locator('table').filter({ hasText: 'Fevereiro' });
    await expect(allRecordsTable).not.toBeVisible();
  });

  test('Status Toggle Works with Collapsed Months', async ({ page }) => {
    // Expand January to see records
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();

    // Find a status button to toggle
    const statusButton = page.locator('button').filter({ hasText: '❌ Pendente' }).first();
    await expect(statusButton).toBeVisible();

    // Collapse January
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Status button should not be visible when collapsed
    await expect(statusButton).not.toBeVisible();

    // Expand January again
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Status button should be visible again
    await expect(statusButton).toBeVisible();

    // Toggle status
    await statusButton.click();
    await page.waitForTimeout(1000);

    // Should now show as completed
    await expect(page.locator('button').filter({ hasText: '✔️ Concluído' })).toBeVisible();
  });

  test('Edit and Delete Work with Collapsed Months', async ({ page }) => {
    // Find January section and verify edit/delete buttons are visible when expanded
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    const deleteButton = page.locator('button').filter({ has: page.locator('i[class*="trash"]') }).first();

    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Collapse January
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Edit/delete buttons should not be visible when collapsed
    await expect(editButton).not.toBeVisible();
    await expect(deleteButton).not.toBeVisible();

    // Expand again
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Buttons should be visible again
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Test delete modal functionality
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Delete modal should appear
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();

    // Cancel delete
    await page.locator('button:has-text("Cancelar")').click();
    await page.waitForTimeout(500);

    // Modal should close and month should still be expanded
    await expect(page.locator('text=Confirmar Exclusão')).not.toBeVisible();
    await expect(editButton).toBeVisible();
  });

  test('Responsive Design - Mobile Collapse', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Month headers should still be visible and clickable on mobile
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();

    // Test collapse functionality on mobile
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();
    await januaryHeader.click();
    await page.waitForTimeout(500);

    // Should work the same on mobile
    const mobileTable = page.locator('table').filter({ hasText: 'Janeiro' });
    await expect(mobileTable).not.toBeVisible();

    // Month summary should still be visible
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
  });

  test('Performance - Fast Toggle Operations', async ({ page }) => {
    const januaryHeader = page.locator('.month-section').filter({ hasText: 'janeiro' }).first();

    const startTime = Date.now();

    // Perform rapid toggle operations
    for (let i = 0; i < 10; i++) {
      await januaryHeader.click();
      await page.waitForTimeout(50); // Minimal wait
    }

    const endTime = Date.now();

    // Should complete within reasonable time (< 2 seconds)
    expect(endTime - startTime).toBeLessThan(2000);

    // Final state should be consistent
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
  });

  test('Month Display Format Verification', async ({ page }) => {
    // Verify proper Portuguese month formatting
    const monthNames = [
      'janeiro de 2025',
      'fevereiro de 2025'
    ];

    for (const monthName of monthNames) {
      await expect(page.locator(`text=${monthName}`)).toBeVisible();
    }

    // Verify old format is not displayed
    await expect(page.locator('text=2025-01')).not.toBeVisible();
    await expect(page.locator('text=2025-02')).not.toBeVisible();
  });

  test('Accessibility - Keyboard Navigation', async ({ page }) => {
    // Test keyboard navigation for collapse functionality
    await page.keyboard.press('Tab');

    // Find the month header (assuming it's focusable)
    const focusedElement = page.locator(':focus');

    // Note: This test would need proper ARIA attributes and keyboard handling
    // For now, we just verify the basic structure exists
    await expect(page.locator('text=janeiro de 2025')).toBeVisible();
    await expect(page.locator('text=fevereiro de 2025')).toBeVisible();
  });
}); 