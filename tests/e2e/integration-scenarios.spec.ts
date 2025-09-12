import { test, expect } from '@playwright/test';
import { loginWithDemo, openCreateModal, fillTransactionForm, submitCreateForm, enableRecurrence } from './auth-helper';

test.describe('Integration Scenarios - Real World Usage Patterns', () => {

  test.beforeEach(async ({ page }) => {
    // Clear data for clean tests
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Status Toggle Bug Fix: Recurrent Records Should Not Be Deleted', async ({ page }) => {
    ('🧪 Testing status toggle bug fix for recurrent records...');

    // Create recurrent transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Salary Monthly',
      amount: '5000.00',
      type: 'Receita'
    });

    // Enable recurrence
    await enableRecurrence(page, 'mensal', '2026-05-15');

    await submitCreateForm(page);

    // Verify multiple records created
    const totalRecords = await page.locator('text=Salary Monthly').count();
    expect(totalRecords).toBeGreaterThan(1);
    (`✅ Created ${totalRecords} recurring records`);

    // Toggle status of ONE record (this was the bug - it deleted all)
    const firstRecord = page.locator('tr').filter({ hasText: 'Salary Monthly' }).first();
    const statusButton = firstRecord.locator('button:has-text("❌")');
    await statusButton.click();
    await page.waitForTimeout(2000);

    // CRITICAL: All records should still exist (bug was deleting them)
    const recordsAfterToggle = await page.locator('text=Salary Monthly').count();
    expect(recordsAfterToggle).toBe(totalRecords);

    // Only ONE record should be marked as completed
    const completedRecords = page.locator('tr').filter({ hasText: 'Salary Monthly' }).locator('button:has-text("✔️")');
    const completedCount = await completedRecords.count();
    expect(completedCount).toBe(1);

    (`✅ Status toggle bug fixed: ${totalRecords} records maintained, 1 marked complete`);
  });

  test('Multiple Status Toggles: Should Work Independently', async ({ page }) => {
    ('🧪 Testing multiple independent status toggles...');

    // Create recurrent transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Multiple Toggle Test');
    await page.type('input[placeholder*="R$"]', '100.00');
    await page.selectOption('select', 'Despesa');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    const totalRecords = await page.locator('text=Multiple Toggle Test').count();
    expect(totalRecords).toBeGreaterThan(2);

    // Toggle first record
    const firstRecord = page.locator('tr').filter({ hasText: 'Multiple Toggle Test' }).first();
    await firstRecord.locator('button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // Toggle second record
    const secondRecord = page.locator('tr').filter({ hasText: 'Multiple Toggle Test' }).nth(1);
    await secondRecord.locator('button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // Verify all records still exist
    const recordsAfterToggles = await page.locator('text=Multiple Toggle Test').count();
    expect(recordsAfterToggles).toBe(totalRecords);

    // Verify exactly 2 records are completed
    const completedCount = await page.locator('tr').filter({ hasText: 'Multiple Toggle Test' }).locator('button:has-text("✔️")').count();
    expect(completedCount).toBe(2);

    (`✅ Multiple toggles: ${totalRecords} records, 2 completed independently`);
  });

  test('Mixed Transaction Types: Normal and Recurrent Together', async ({ page }) => {
    ('🧪 Testing mixed normal and recurrent transactions...');

    // Create normal transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'One-time Purchase');
    await page.type('input[placeholder*="R$"]', '250.00');
    await page.selectOption('select', 'Despesa');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Create recurrent transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Monthly Subscription');
    await page.type('input[placeholder*="R$"]', '50.00');
    await page.selectOption('select', 'Despesa');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-04-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Verify both types exist
    await expect(page.locator('text=One-time Purchase')).toBeVisible();
    const subscriptionCount = await page.locator('text=Monthly Subscription').count();
    expect(subscriptionCount).toBeGreaterThan(1);

    // Edit normal transaction
    const normalRow = page.locator('tr').filter({ hasText: 'One-time Purchase' });
    await normalRow.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    await page.fill('input[value*="One-time"]', 'One-time Purchase EDITED');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Edit recurrent transaction
    const recurrentRow = page.locator('tr').filter({ hasText: 'Monthly Subscription' }).first();
    await recurrentRow.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    await page.fill('input[value*="Monthly"]', 'Premium Subscription');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify both edits worked
    await expect(page.locator('text=One-time Purchase EDITED')).toBeVisible();
    await expect(page.locator('text=Premium Subscription')).toBeVisible();

    ('✅ Mixed transaction types working correctly');
  });

  test('Filter Integration: Works with Recurrent Transactions', async ({ page }) => {
    ('🧪 Testing filters with recurrent transactions...');

    // Create recurrent income
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Recurrent Income');
    await page.type('input[placeholder*="R$"]', '3000.00');
    await page.selectOption('select', 'Receita');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Create recurrent expense
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Recurrent Expense');
    await page.type('input[placeholder*="R$"]', '800.00');
    await page.selectOption('select', 'Despesa');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Test Receitas filter
    await page.click('button:has-text("💰 Receitas")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Recurrent Income')).toBeVisible();
    await expect(page.locator('text=Recurrent Expense')).not.toBeVisible();

    // Test Despesas filter
    await page.click('button:has-text("💸 Despesas")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Recurrent Expense')).toBeVisible();
    await expect(page.locator('text=Recurrent Income')).not.toBeVisible();

    // Test All filter
    await page.click('button:has-text("📊 Todos")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Recurrent Income')).toBeVisible();
    await expect(page.locator('text=Recurrent Expense')).toBeVisible();

    ('✅ Filters working correctly with recurrent transactions');
  });

  test('Month Grouping: Recurrent Records Distributed Correctly', async ({ page }) => {
    ('🧪 Testing month grouping with recurrent records...');

    // Create recurrent transaction spanning multiple months
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Cross-Month Recurrent');
    await page.type('input[placeholder*="R$"]', '400.00');
    await page.selectOption('select', 'Receita');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-05-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Verify records appear in different month sections
    const monthHeaders = page.locator('h3').filter({ hasText: '2025' }).or(page.locator('h3').filter({ hasText: '2026' }));
    const monthCount = await monthHeaders.count();
    expect(monthCount).toBeGreaterThan(1);

    // Test month collapse/expand with recurrent data
    if (monthCount > 0) {
      const firstMonth = monthHeaders.first();
      await firstMonth.click();
      await page.waitForTimeout(500);

      // Month should collapse (records hidden)
      // Then expand again
      await firstMonth.click();
      await page.waitForTimeout(500);

      // Records should be visible again
      await expect(page.locator('text=Cross-Month Recurrent')).toBeVisible();
    }

    (`✅ Month grouping: Records distributed across ${monthCount} months`);
  });

  test('Data Persistence: Survive Page Reloads', async ({ page }) => {
    ('🧪 Testing data persistence through reloads...');

    // Create various transaction types
    const transactions = [
      { desc: 'Normal Persistence', recurrent: false },
      { desc: 'Recurrent Persistence', recurrent: true }
    ];

    let totalRecordsBefore = 0;

    for (const transaction of transactions) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', transaction.desc);
      await page.type('input[placeholder*="R$"]', '200.00');
      await page.selectOption('select', 'Despesa');

      if (transaction.recurrent) {
        await page.check('input[type="checkbox"]');
        await page.selectOption('select', 'mensal');
        await page.fill('input[type="date"]:last-of-type', '2026-03-15');
      }

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);
    }

    // Count total records before reload
    const allRows = page.locator('tbody tr');
    totalRecordsBefore = await allRows.count();
    expect(totalRecordsBefore).toBeGreaterThan(1);

    // Reload page
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify all data persisted
    await expect(page.locator('text=Normal Persistence')).toBeVisible();
    await expect(page.locator('text=Recurrent Persistence')).toBeVisible();

    const totalRecordsAfter = await allRows.count();
    expect(totalRecordsAfter).toBe(totalRecordsBefore);

    (`✅ Data persistence: ${totalRecordsAfter} records survived reload`);
  });

  test('Error Recovery: Handle Invalid Operations Gracefully', async ({ page }) => {
    ('🧪 Testing error recovery scenarios...');

    // Create a transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Error Recovery Test');
    await page.type('input[placeholder*="R$"]', '100.00');
    await page.selectOption('select', 'Despesa');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Try rapid-fire operations (might cause race conditions)
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    const deleteButton = page.locator('button').filter({ has: page.locator('i[class*="trash"]') }).first();

    // Rapidly click edit and delete (should handle gracefully)
    await editButton.click();
    await page.waitForTimeout(100);

    // If modal opened, close it
    const cancelButton = page.locator('button:has-text("Cancelar")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(500);
    }

    // Try delete
    await deleteButton.click();
    await page.waitForTimeout(500);

    // If delete modal appeared, cancel it
    const deleteModal = page.locator('text=Confirmar Exclusão');
    if (await deleteModal.isVisible()) {
      await page.click('button:has-text("Cancelar")');
    }

    // Application should still be functional
    await expect(page.locator('text=Error Recovery Test')).toBeVisible();

    ('✅ Error recovery: Application handles rapid operations gracefully');
  });

  test('Performance: Large Dataset Operations', async ({ page }) => {
    ('🧪 Testing performance with larger dataset...');

    const startTime = Date.now();

    // Create multiple recurrent transactions (generates many records)
    const recurrentTypes = [
      { desc: 'Weekly Expense', freq: 'semanal' },
      { desc: 'Monthly Income', freq: 'mensal' },
      { desc: 'Quarterly Bonus', freq: 'trimestral' }
    ];

    for (const type of recurrentTypes) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', type.desc);
      await page.type('input[placeholder*="R$"]', '500.00');
      await page.selectOption('select', 'Receita');

      await page.check('input[type="checkbox"]');
      await page.selectOption('select', type.freq);
      await page.fill('input[type="date"]:last-of-type', '2026-12-31');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);
    }

    const creationTime = Date.now() - startTime;

    // Count total records created
    const allRows = page.locator('tbody tr');
    const totalRecords = await allRows.count();
    expect(totalRecords).toBeGreaterThan(20); // Should have many records

    // Test filtering performance with large dataset
    const filterStartTime = Date.now();

    await page.click('button:has-text("💰 Receitas")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("📊 Todos")');
    await page.waitForTimeout(1000);

    const filterTime = Date.now() - filterStartTime;

    // Should complete within reasonable time
    expect(creationTime).toBeLessThan(20000);
    expect(filterTime).toBeLessThan(5000);

    (`✅ Performance: ${totalRecords} records created in ${creationTime}ms, filtering in ${filterTime}ms`);
  });

  test('Complex User Journey: Real Monthly Budget Scenario', async ({ page }) => {
    ('🧪 Testing complex real-world budget scenario...');

    // Scenario: User sets up monthly budget with income and various expenses

    // 1. Add monthly salary (recurrent)
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Monthly Salary');
    await page.type('input[placeholder*="R$"]', '6000.00');
    await page.selectOption('select', 'Receita');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-12-31');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // 2. Add fixed monthly expenses (recurrent)
    const fixedExpenses = [
      { desc: 'Rent', value: '1800' },
      { desc: 'Utilities', value: '250' },
      { desc: 'Insurance', value: '300' }
    ];

    for (const expense of fixedExpenses) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', expense.desc);
      await page.type('input[placeholder*="R$"]', expense.value);
      await page.selectOption('select', 'Despesa');

      await page.check('input[type="checkbox"]');
      await page.selectOption('select', 'mensal');
      await page.fill('input[type="date"]:last-of-type', '2026-06-30');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);
    }

    // 3. Add some one-time expenses
    const oneTimeExpenses = [
      { desc: 'Car Repair', value: '800' },
      { desc: 'Vacation', value: '2500' }
    ];

    for (const expense of oneTimeExpenses) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', expense.desc);
      await page.type('input[placeholder*="R$"]', expense.value);
      await page.selectOption('select', 'Despesa');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(1500);
    }

    // 4. Review the budget (filter by type)
    await page.click('button:has-text("💰 Receitas")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Monthly Salary')).toBeVisible();

    await page.click('button:has-text("💸 Despesas")');
    await page.waitForTimeout(1000);

    for (const expense of [...fixedExpenses, ...oneTimeExpenses]) {
      await expect(page.locator(`text=${expense.desc}`)).toBeVisible();
    }

    // 5. Mark some expenses as paid
    await page.click('button:has-text("📊 Todos")');
    await page.waitForTimeout(1000);

    const rentRow = page.locator('tr').filter({ hasText: 'Rent' }).first();
    await rentRow.locator('button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    const utilitiesRow = page.locator('tr').filter({ hasText: 'Utilities' }).first();
    await utilitiesRow.locator('button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // 6. Edit a recurring expense (price increase)
    const insuranceRow = page.locator('tr').filter({ hasText: 'Insurance' }).first();
    await insuranceRow.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    await page.fill('input[value*="300"]', '350.00');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // 7. Verify the complex scenario worked
    const totalRows = await page.locator('tbody tr').count();
    expect(totalRows).toBeGreaterThan(15); // Should have many records from recurrence

    // Verify key transactions exist and were modified correctly
    await expect(page.locator('text=Monthly Salary')).toBeVisible();
    await expect(page.locator('text=R$ 350,00')).toBeVisible(); // Updated insurance
    await expect(page.locator('text=Car Repair')).toBeVisible();

    (`✅ Complex budget scenario: ${totalRows} total records managed successfully`);
  });
});
