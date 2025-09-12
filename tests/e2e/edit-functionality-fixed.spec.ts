import { test, expect } from '@playwright/test';
import { loginWithDemo, openCreateModal, fillTransactionForm, submitCreateForm, submitEditForm } from './auth-helper';

test.describe('Edit Functionality - Bug Fixes Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Edit Normal Transaction: Modal Closes and Data Persists', async ({ page }) => {
    ('🧪 Testing edit functionality fix for normal transactions...');

    // Create a test transaction first
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Original Description',
      amount: '100.00',
      type: 'Despesa'
    });

    await submitCreateForm(page);

    // Verify transaction was created
    await expect(page.locator('text=Original Description').first()).toBeVisible();

    // Open edit modal
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Verify edit modal opened
    await expect(page.locator('text=Editar Registro')).toBeVisible();

    // Edit the transaction
    await page.fill('input[type="text"]', 'EDITED Description');
    await page.fill('input[placeholder="R$ 0,00"]', '250.00');

    // Save changes
    await submitEditForm(page);

    // CRITICAL: Modal should close (this was the bug)
    await expect(page.locator('text=Editar Registro')).not.toBeVisible();

    // CRITICAL: Data should be updated in the table (this was the bug)
    await expect(page.locator('text=EDITED Description').first()).toBeVisible();
    await expect(page.locator('text=R$ 250,00').first()).toBeVisible();
    await expect(page.locator('text=Original Description')).not.toBeVisible();

    ('✅ Edit functionality fix verified: Modal closes and data persists');
  });

  test('Edit Recurrent Transaction: Should Work After Bug Fix', async ({ page }) => {
    ('🧪 Testing edit functionality fix for recurrent transactions...');

    // Create a recurrent transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Recurrent Original',
      amount: '500.00',
      type: 'Receita'
    });

    // Enable recurrence
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-04-15');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(3000);

    // Verify multiple records were created
    const recordCount = await page.locator('text=Recurrent Original').count();
    expect(recordCount).toBeGreaterThan(1);

    // Edit the first recurrent record
    const firstRecord = page.locator('tr').filter({ hasText: 'Recurrent Original' }).first();
    await firstRecord.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    // Verify edit modal opened with recurrence settings
    await expect(page.locator('text=Editar Registro')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]:checked')).toBeVisible();

    // Edit the transaction
    await page.fill('input[value*="Recurrent Original"]', 'Recurrent EDITED');
    await page.fill('input[value*="500"]', '750.00');

    // Save changes
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // CRITICAL: Modal should close (this was the bug)
    await expect(page.locator('text=Editar Registro')).not.toBeVisible();

    // CRITICAL: Data should be updated (this was the bug)
    await expect(page.locator('text=Recurrent EDITED')).toBeVisible();
    await expect(page.locator('text=R$ 750,00')).toBeVisible();

    ('✅ Recurrent edit fix verified: Modal closes and data persists');
  });

  test('Edit Form Validation: Should Show Errors and Block Save', async ({ page }) => {
    ('🧪 Testing edit form validation...');

    // Create a test transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Validation Test',
      amount: '75.00',
      type: 'Despesa'
    });

    await submitCreateForm(page);

    // Open edit modal
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Clear required fields to test validation
    await page.fill('input[value*="Validation Test"]', '');
    await page.fill('input[value*="75"]', '');

    // Try to save (should be blocked)
    const saveButton = page.locator('button:has-text("Salvar")');

    // Save button should be disabled or form should show validation errors
    const isDisabled = await saveButton.isDisabled();
    if (!isDisabled) {
      // If not disabled, click and verify modal stays open
      await saveButton.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Editar Registro')).toBeVisible();
    }

    ('✅ Edit form validation working correctly');

    // Close modal
    await page.click('button:has-text("Cancelar")');
  });

  test('Edit Multiple Transactions: Each Should Work Independently', async ({ page }) => {
    ('🧪 Testing multiple independent edits...');

    // Create multiple test transactions
    const transactions = [
      { desc: 'Transaction 1', value: '100', type: 'Receita' },
      { desc: 'Transaction 2', value: '200', type: 'Despesa' },
      { desc: 'Transaction 3', value: '300', type: 'Receita' }
    ];

    for (const transaction of transactions) {
      await openCreateModal(page);

      await fillTransactionForm(page, {
        description: transaction.desc,
        amount: transaction.value,
        type: transaction.type as 'Receita' | 'Despesa'
      });

      await submitCreateForm(page);
    }

    // Edit each transaction independently
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      // Find the specific transaction row
      const transactionRow = page.locator('tr').filter({ hasText: transaction.desc });
      await transactionRow.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
      await page.waitForTimeout(1000);

      // Verify modal opened
      await expect(page.locator('text=Editar Registro')).toBeVisible();

      // Edit the description
      await page.fill(`input[value*="${transaction.desc}"]`, `${transaction.desc} EDITED`);

      // Save
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(2000);

      // Verify modal closed and data updated
      await expect(page.locator('text=Editar Registro')).not.toBeVisible();
      await expect(page.locator(`text=${transaction.desc} EDITED`)).toBeVisible();

      (`✅ Transaction ${i + 1} edited successfully`);
    }

    ('✅ Multiple independent edits working correctly');
  });

  test('Edit With Category Changes: Should Update All Fields', async ({ page }) => {
    ('🧪 Testing edit with category changes...');

    // Create transaction with specific category
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Category Test',
      amount: '150.00',
      type: 'Despesa'
    });
    await page.selectOption('select', '🍽️ Alimentação');

    await submitCreateForm(page);

    // Verify initial category
    await expect(page.locator('text=🍽️ Alimentação')).toBeVisible();

    // Edit and change category
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Change description, value, and category
    await page.fill('input[value*="Category Test"]', 'Updated Category Test');
    await page.fill('input[value*="150"]', '225.00');
    await page.selectOption('select', '🏠 Moradia');

    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify all changes were applied
    await expect(page.locator('text=Updated Category Test')).toBeVisible();
    await expect(page.locator('text=R$ 225,00')).toBeVisible();
    await expect(page.locator('text=🏠 Moradia')).toBeVisible();
    await expect(page.locator('text=🍽️ Alimentação')).not.toBeVisible();

    ('✅ Category changes in edit working correctly');
  });

  test('Edit Status Preservation: Status Should Remain After Edit', async ({ page }) => {
    ('🧪 Testing status preservation during edit...');

    // Create transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Status Test',
      amount: '80.00',
      type: 'Despesa'
    });

    await submitCreateForm(page);

    // Toggle status to completed
    const statusButton = page.locator('button:has-text("❌")').first();
    await statusButton.click();
    await page.waitForTimeout(1000);

    // Verify status changed to completed
    await expect(page.locator('button:has-text("✔️")')).toBeVisible();

    // Edit the transaction
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Edit description only
    await page.fill('input[value*="Status Test"]', 'Status Test EDITED');

    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify status was preserved (should still be completed)
    await expect(page.locator('text=Status Test EDITED')).toBeVisible();
    await expect(page.locator('button:has-text("✔️")')).toBeVisible();

    ('✅ Status preservation during edit working correctly');
  });

  test('Edit Cancel: Should Discard Changes and Close Modal', async ({ page }) => {
    ('🧪 Testing edit cancel functionality...');

    // Create transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Cancel Test',
      amount: '90.00',
      type: 'Receita'
    });

    await submitCreateForm(page);

    // Open edit modal
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Make changes but don't save
    await page.fill('input[value*="Cancel Test"]', 'This Should Not Save');
    await page.fill('input[value*="90"]', '999.00');

    // Cancel instead of saving
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(1000);

    // Verify modal closed
    await expect(page.locator('text=Editar Registro')).not.toBeVisible();

    // Verify original data is unchanged
    await expect(page.locator('text=Cancel Test')).toBeVisible();
    await expect(page.locator('text=R$ 90,00')).toBeVisible();
    await expect(page.locator('text=This Should Not Save')).not.toBeVisible();

    ('✅ Edit cancel functionality working correctly');
  });

  test('Edit Performance: Should Handle Rapid Edit Operations', async ({ page }) => {
    ('🧪 Testing edit performance...');

    // Create multiple transactions quickly
    for (let i = 1; i <= 3; i++) {
      await openCreateModal(page);

      await fillTransactionForm(page, {
        description: `Rapid Edit ${i}`,
        amount: `${i * 50}`,
        type: 'Despesa'
      });

      await submitCreateForm(page);
      await page.waitForTimeout(1000);
    }

    const startTime = Date.now();

    // Rapidly edit each transaction
    for (let i = 1; i <= 3; i++) {
      const row = page.locator('tr').filter({ hasText: `Rapid Edit ${i}` });
      await row.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
      await page.waitForTimeout(500);

      await page.fill(`input[value*="Rapid Edit ${i}"]`, `Rapid Edit ${i} FAST`);
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(1000);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(15000);

    // Verify all edits were successful
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=Rapid Edit ${i} FAST`)).toBeVisible();
    }

    (`✅ Rapid edit performance: ${totalTime}ms for 3 edits`);
  });
});
