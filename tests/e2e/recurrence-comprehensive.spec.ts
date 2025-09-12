import { test, expect } from '@playwright/test';
import { loginWithDemo, openCreateModal, fillTransactionForm, submitCreateForm, enableRecurrence } from './auth-helper';

test.describe('Comprehensive Recurrence Functionality E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing data for clean tests
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Recurrence Creation: Monthly Frequency', async ({ page }) => {
    ('🔄 Testing monthly recurrence creation...');

    // Create monthly recurring transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Aluguel Mensal',
      amount: '1500.00',
      type: 'Despesa'
    });

    // Enable recurrence
    await enableRecurrence(page, 'mensal', '2026-06-15');

    await submitCreateForm(page);

    // Verify multiple records created for different months
    const aluguelRecords = page.locator('text=Aluguel Mensal');
    const recordCount = await aluguelRecords.count();

    expect(recordCount).toBeGreaterThanOrEqual(6); // Should have multiple months
    (`✅ Monthly recurrence: ${recordCount} records created`);

    // Verify records appear in different month sections
    const monthSections = page.locator('h3').filter({ hasText: '2025' }).or(page.locator('h3').filter({ hasText: '2026' }));
    const monthCount = await monthSections.count();
    expect(monthCount).toBeGreaterThan(1);
    (`✅ Records distributed across ${monthCount} month sections`);
  });

  test('Recurrence Creation: Different Frequencies', async ({ page }) => {
    ('🔄 Testing different recurrence frequencies...');

    const frequencies = [
      { freq: 'semanal', desc: 'Weekly Task', expectedMin: 10 },
      { freq: 'quinzenal', desc: 'Bi-weekly Payment', expectedMin: 5 },
      { freq: 'trimestral', desc: 'Quarterly Report', expectedMin: 2 }
    ];

    for (const test of frequencies) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', test.desc);
      await page.type('input[placeholder*="R$"]', '100.00');
      await page.selectOption('select', 'Despesa');

      // Enable recurrence with specific frequency
      await page.check('input[type="checkbox"]');
      await page.selectOption('select', test.freq);
      await page.fill('input[type="date"]:last-of-type', '2026-03-15');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);

      // Verify expected number of records
      const records = await page.locator(`text=${test.desc}`).count();
      expect(records).toBeGreaterThanOrEqual(test.expectedMin);
      (`✅ ${test.freq}: ${records} records created`);

      // Clean up for next test
      await page.reload();
      await page.waitForTimeout(2000);
    }
  });

  test('Recurrence Edit: Convert Normal to Recurrent', async ({ page }) => {
    ('🔄 Testing conversion from normal to recurrent...');

    // Create normal transaction
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'One-time Payment');
    await page.type('input[placeholder*="R$"]', '500.00');
    await page.selectOption('select', 'Despesa');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Verify single record
    let recordCount = await page.locator('text=One-time Payment').count();
    expect(recordCount).toBe(1);

    // Edit to make recurrent
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Enable recurrence in edit modal
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-04-15');

    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(3000);

    // Verify multiple records were generated
    recordCount = await page.locator('text=One-time Payment').count();
    expect(recordCount).toBeGreaterThan(1);
    (`✅ Conversion successful: 1 → ${recordCount} records`);
  });

  test('Recurrence Edit: Modify Existing Recurrent Transaction', async ({ page }) => {
    ('🔄 Testing modification of existing recurrent transaction...');

    // Create recurrent transaction
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Streaming Service');
    await page.type('input[placeholder*="R$"]', '25.90');
    await page.selectOption('select', 'Despesa');

    // Enable recurrence
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-05-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Edit the first record
    const firstRecord = page.locator('tr').filter({ hasText: 'Streaming Service' }).first();
    await firstRecord.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    // Verify recurrence checkbox is checked in edit modal
    await expect(page.locator('input[type="checkbox"]:checked')).toBeVisible();

    // Modify description and value
    await page.fill('input[value*="Streaming"]', 'Premium Streaming');
    await page.fill('input[value*="25"]', '35.90');

    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify edit was successful
    await expect(page.locator('text=Premium Streaming')).toBeVisible();
    await expect(page.locator('text=R$ 35,90')).toBeVisible();
    ('✅ Recurrent transaction modified successfully');
  });

  test('Recurrence Deletion: Surgical Deletion', async ({ page }) => {
    ('🔄 Testing surgical deletion of recurrent records...');

    // Create recurrent transaction
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Phone Bill');
    await page.type('input[placeholder*="R$"]', '75.00');
    await page.selectOption('select', 'Despesa');

    // Enable recurrence
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-04-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Count records before deletion
    const recordsBeforeDelete = await page.locator('text=Phone Bill').count();
    expect(recordsBeforeDelete).toBeGreaterThan(1);

    // Delete one specific record (should be surgical)
    const secondRecord = page.locator('tr').filter({ hasText: 'Phone Bill' }).nth(1);
    await secondRecord.locator('button').filter({ has: page.locator('i[class*="trash"]') }).click();
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Excluir")');
    await page.waitForTimeout(2000);

    // Verify only one record was deleted
    const recordsAfterDelete = await page.locator('text=Phone Bill').count();
    expect(recordsAfterDelete).toBe(recordsBeforeDelete - 1);
    (`✅ Surgical deletion: ${recordsBeforeDelete} → ${recordsAfterDelete} records`);
  });

  test('Recurrence Status Toggle: Should Not Delete Other Records', async ({ page }) => {
    ('🔄 Testing status toggle with recurrent transactions...');

    // Create recurrent transaction
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Gym Membership');
    await page.type('input[placeholder*="R$"]', '120.00');
    await page.selectOption('select', 'Despesa');

    // Enable recurrence
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Count total records
    const totalRecords = await page.locator('text=Gym Membership').count();
    expect(totalRecords).toBeGreaterThan(1);

    // Toggle status of first record
    const firstRecord = page.locator('tr').filter({ hasText: 'Gym Membership' }).first();
    const statusButton = firstRecord.locator('button:has-text("❌")');
    await statusButton.click();
    await page.waitForTimeout(2000);

    // Verify all records still exist
    const recordsAfterToggle = await page.locator('text=Gym Membership').count();
    expect(recordsAfterToggle).toBe(totalRecords);

    // Verify only one record is marked as completed
    const completedRecords = page.locator('tr').filter({ hasText: 'Gym Membership' }).locator('button:has-text("✔️")');
    const completedCount = await completedRecords.count();
    expect(completedCount).toBe(1);

    (`✅ Status toggle: ${totalRecords} records maintained, 1 marked complete`);
  });

  test('Recurrence Edge Cases: End Date Validation', async ({ page }) => {
    ('🔄 Testing recurrence edge cases...');

    // Test 1: Very short recurrence period
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Short Recurrence');
    await page.type('input[placeholder*="R$"]', '50.00');
    await page.selectOption('select', 'Receita');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');

    // Set end date only 1 month in future
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = nextMonth.toISOString().split('T')[0];
    await page.fill('input[type="date"]:last-of-type', endDate);

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Should still create records
    const shortRecords = await page.locator('text=Short Recurrence').count();
    expect(shortRecords).toBeGreaterThan(0);
    (`✅ Short recurrence: ${shortRecords} records created`);

    // Clean up
    await page.reload();
    await page.waitForTimeout(2000);

    // Test 2: Very long recurrence period (should be limited)
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Long Recurrence');
    await page.type('input[placeholder*="R$"]', '100.00');
    await page.selectOption('select', 'Despesa');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2030-12-31'); // Very far future

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Should be limited to reasonable number (e.g., 24 months max)
    const longRecords = await page.locator('text=Long Recurrence').count();
    expect(longRecords).toBeLessThanOrEqual(25); // Should be limited
    (`✅ Long recurrence limited: ${longRecords} records created (max expected)`);
  });

  test('Recurrence UI: Preview and Feedback', async ({ page }) => {
    ('🔄 Testing recurrence UI feedback...');

    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'UI Test Recurrence');
    await page.type('input[placeholder*="R$"]', '200.00');
    await page.selectOption('select', 'Receita');

    // Enable recurrence and check for UI feedback
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Recurrence options should become visible
    await expect(page.locator('select')).toBeVisible(); // Frequency selector
    await expect(page.locator('input[type="date"]:last-of-type')).toBeVisible(); // End date

    // Set parameters and look for preview text
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-04-15');

    // Look for occurrence count preview
    const previewText = page.locator('text*="ocorrências"');
    if (await previewText.isVisible()) {
      ('✅ Recurrence preview text found');
    }

    // Verify form is ready for submission
    const createButton = page.locator('button:has-text("Criar")');
    await expect(createButton).toBeEnabled();

    await createButton.click();
    await page.waitForTimeout(3000);

    // Verify creation was successful
    await expect(page.locator('text=UI Test Recurrence')).toBeVisible();
    ('✅ Recurrence UI feedback working correctly');
  });

  test('Recurrence Performance: Large Number of Records', async ({ page }) => {
    ('🔄 Testing recurrence performance with many records...');

    const startTime = Date.now();

    // Create a recurrence that generates many records
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Performance Test Recurrence');
    await page.type('input[placeholder*="R$"]', '10.00');
    await page.selectOption('select', 'Receita');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'semanal'); // Weekly = many records
    await page.fill('input[type="date"]:last-of-type', '2026-12-31');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(5000); // Give more time for many records

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Verify records were created
    const recordCount = await page.locator('text=Performance Test Recurrence').count();
    expect(recordCount).toBeGreaterThan(10); // Should have many weekly records

    // Should complete within reasonable time (less than 10 seconds)
    expect(processingTime).toBeLessThan(10000);

    (`✅ Performance test: ${recordCount} records created in ${processingTime}ms`);
  });

  test('Recurrence Data Integrity: Persistence Across Reloads', async ({ page }) => {
    ('🔄 Testing recurrence data persistence...');

    // Create recurrent transaction
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Persistence Test');
    await page.type('input[placeholder*="R$"]', '300.00');
    await page.selectOption('select', 'Despesa');

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Count records before reload
    const recordsBeforeReload = await page.locator('text=Persistence Test').count();
    expect(recordsBeforeReload).toBeGreaterThan(1);

    // Reload page to test persistence
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify all records still exist
    const recordsAfterReload = await page.locator('text=Persistence Test').count();
    expect(recordsAfterReload).toBe(recordsBeforeReload);

    // Test editing one record to verify recurrence metadata is preserved
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Recurrence checkbox should still be checked
    await expect(page.locator('input[type="checkbox"]:checked')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancelar")');

    (`✅ Data persistence verified: ${recordsAfterReload} records maintained after reload`);
  });
});
