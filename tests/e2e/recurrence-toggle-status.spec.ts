import { test, expect } from '@playwright/test';
import { loginWithDemo } from './auth-helper';

test.describe('Recurrence Toggle Status Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data to start fresh
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('should not delete other recurring records when marking one as completed', async ({ page }) => {
    // Step 1: Create a recurring record
    ('🧪 [E2E] Creating recurring record...');

    // Open the add record form
    await page.locator('[data-testid="add-record-button"], .add-record-form input[placeholder*="Descrição"]').first().click();

    // Fill the form
    await page.fill('input[placeholder*="Descrição"]', 'Salário Recorrente');
    await page.fill('input[placeholder*="Valor"]', '5000');
    await page.selectOption('select:has-text("Tipo")', 'Receita');
    await page.fill('input[type="date"]', '2025-01-15');

    // Enable recurrence
    const recurrenceToggle = page.locator('input[type="checkbox"]').filter({ hasText: 'Recorrente' }).or(page.locator('label:has-text("Recorrente") input[type="checkbox"]'));
    await recurrenceToggle.check();

    // Set recurrence to monthly
    await page.selectOption('select:has-text("Frequência"), select:has-text("mensal"), select[value="mensal"]', 'mensal');

    // Set end date to create multiple records
    await page.locator('input[type="date"]').last().fill('2025-05-15');

    // Submit the form
    await page.click('button:has-text("Adicionar"), button[type="submit"]');

    // Wait for records to be created
    await page.waitForTimeout(2000);

    // Step 2: Verify multiple recurring records were created
    ('🧪 [E2E] Verifying recurring records were created...');

    const recordRows = page.locator('tr:has-text("Salário Recorrente"), .record-item:has-text("Salário Recorrente")');
    const recordCount = await recordRows.count();

    (`🧪 [E2E] Found ${recordCount} recurring records`);
    expect(recordCount).toBeGreaterThan(1); // Should have multiple records

    // Step 3: Mark the first record as completed
    ('🧪 [E2E] Marking first record as completed...');

    const firstRecord = recordRows.first();
    const statusButton = firstRecord.locator('button:has-text("Pendente"), button:has-text("❌"), [data-testid="status-toggle"]').first();

    // Click to toggle status to completed
    await statusButton.click();

    // Wait for the update to process
    await page.waitForTimeout(2000);

    // Step 4: Verify all records still exist
    ('🧪 [E2E] Verifying all records still exist...');

    const recordsAfterToggle = page.locator('tr:has-text("Salário Recorrente"), .record-item:has-text("Salário Recorrente")');
    const recordCountAfterToggle = await recordsAfterToggle.count();

    (`🧪 [E2E] Found ${recordCountAfterToggle} records after toggle`);

    // CRITICAL: This should be the same as before
    expect(recordCountAfterToggle).toBe(recordCount);

    // Step 5: Verify only one record is marked as completed
    ('🧪 [E2E] Verifying only one record is completed...');

    const completedRecords = page.locator('tr:has-text("Salário Recorrente") button:has-text("Concluído"), .record-item:has-text("Salário Recorrente") button:has-text("✔️")');
    const completedCount = await completedRecords.count();

    expect(completedCount).toBe(1); // Only one should be completed

    const pendingRecords = page.locator('tr:has-text("Salário Recorrente") button:has-text("Pendente"), .record-item:has-text("Salário Recorrente") button:has-text("❌")');
    const pendingCount = await pendingRecords.count();

    expect(pendingCount).toBe(recordCount - 1); // Rest should be pending

    ('✅ [E2E] Test passed - Recurring records bug is fixed!');
  });

  test('should handle multiple status toggles correctly', async ({ page }) => {
    // Similar setup but test multiple toggles
    ('🧪 [E2E] Testing multiple status toggles...');

    // Create recurring records
    await page.goto('/');

    // Open form and create recurring record
    await page.locator('input[placeholder*="Descrição"]').first().fill('Teste Multi Toggle');
    await page.locator('input[placeholder*="Valor"]').first().fill('1000');
    await page.selectOption('select', 'Despesa');
    await page.fill('input[type="date"]', '2025-02-01');

    // Enable recurrence
    const recurrenceCheckbox = page.locator('input[type="checkbox"]').first();
    await recurrenceCheckbox.check();

    // Set end date for 3 months
    await page.locator('input[type="date"]').last().fill('2025-04-01');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(2000);

    // Get all records
    const allRecords = page.locator('tr:has-text("Teste Multi Toggle"), .record-item:has-text("Teste Multi Toggle")');
    const totalRecords = await allRecords.count();

    expect(totalRecords).toBeGreaterThan(1);

    // Toggle first record
    await allRecords.first().locator('button:has-text("Pendente"), button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // Toggle second record  
    await allRecords.nth(1).locator('button:has-text("Pendente"), button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // Verify all records still exist
    const recordsAfterToggles = page.locator('tr:has-text("Teste Multi Toggle"), .record-item:has-text("Teste Multi Toggle")');
    const finalCount = await recordsAfterToggles.count();

    expect(finalCount).toBe(totalRecords);

    // Verify we have 2 completed records
    const completed = page.locator('tr:has-text("Teste Multi Toggle") button:has-text("Concluído"), .record-item:has-text("Teste Multi Toggle") button:has-text("✔️")');
    const completedFinal = await completed.count();

    expect(completedFinal).toBe(2);

    ('✅ [E2E] Multiple toggles test passed!');
  });

  test('should preserve recurrence metadata after status toggle', async ({ page }) => {
    ('🧪 [E2E] Testing recurrence metadata preservation...');

    // Create recurring record and toggle status
    await page.goto('/');

    // Quick form fill
    await page.locator('input[placeholder*="Descrição"]').first().fill('Metadata Test');
    await page.locator('input[placeholder*="Valor"]').first().fill('750');
    await page.fill('input[type="date"]', '2025-03-01');

    // Enable recurrence
    await page.locator('input[type="checkbox"]').first().check();
    await page.locator('input[type="date"]').last().fill('2025-06-01');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(2000);

    // Check that recurring icons are present (indicates metadata is preserved)
    const recurringIcons = page.locator('.fa-repeat, .fa-sync, [data-testid="recurring-icon"]');
    const iconCount = await recurringIcons.count();

    expect(iconCount).toBeGreaterThan(0); // Should have recurring indicators

    // Toggle one record
    const firstRecord = page.locator('tr:has-text("Metadata Test"), .record-item:has-text("Metadata Test")').first();
    await firstRecord.locator('button:has-text("Pendente"), button:has-text("❌")').click();
    await page.waitForTimeout(1000);

    // Verify recurring icons still exist after toggle
    const iconsAfterToggle = page.locator('.fa-repeat, .fa-sync, [data-testid="recurring-icon"]');
    const iconCountAfter = await iconsAfterToggle.count();

    expect(iconCountAfter).toBeGreaterThan(0); // Icons should still be there

    ('✅ [E2E] Metadata preservation test passed!');
  });
});
