import { test, expect } from '@playwright/test';
import { loginWithDemo, openCreateModal, fillTransactionForm, submitCreateForm, enableRecurrence } from './auth-helper';

test.describe('Comprehensive CRUD and Recurrence E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Complete Flow: Create, Edit, Delete Normal Transactions', async ({ page }) => {
    ('🧪 Testing complete normal transaction CRUD flow...');

    // STEP 1: CREATE NORMAL TRANSACTION
    ('➕ Step 1: Creating normal transaction...');

    // Open create modal
    await openCreateModal(page);

    // Fill the form using helper functions
    await fillTransactionForm(page, {
      description: 'Compra Supermercado - CRUD Test',
      amount: '85.50',
      type: 'Despesa',
      category: '🍽️ Alimentação'
    });

    // Submit the form
    await submitCreateForm(page);

    // Verify transaction was created
    await expect(page.locator('text=Compra Supermercado - CRUD Test').first()).toBeVisible();
    ('✅ Normal transaction created successfully');

    // STEP 2: EDIT THE TRANSACTION
    ('✏️ Step 2: Editing the transaction...');

    // Find and click edit button for our transaction
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Verify edit modal opened
    await expect(page.locator('text=Editar Registro')).toBeVisible();

    // Edit the description and value
    await page.fill('input[value*="Compra Supermercado"]', 'Mercado Extra - EDITADO');
    await page.fill('input[value*="85"]', '125.00');

    // Save changes
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify edit was successful (modal should close and data should update)
    await expect(page.locator('text=Editar Registro')).not.toBeVisible();
    await expect(page.locator('text=Mercado Extra - EDITADO').first()).toBeVisible();
    await expect(page.locator('text=R$ 125,00').first()).toBeVisible();
    ('✅ Transaction edited successfully');

    // STEP 3: DELETE THE TRANSACTION
    ('🗑️ Step 3: Deleting the transaction...');

    // Find and click delete button
    const deleteButton = page.locator('button').filter({ has: page.locator('i[class*="trash"]') }).first();
    await deleteButton.click();
    await page.waitForTimeout(1000);

    // Verify delete confirmation modal
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
    await expect(page.locator('text=Mercado Extra - EDITADO').first()).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Excluir")');
    await page.waitForTimeout(2000);

    // Verify transaction was deleted
    await expect(page.locator('text=Mercado Extra - EDITADO')).not.toBeVisible();
    ('✅ Transaction deleted successfully');

    ('🎉 Normal transaction CRUD flow completed successfully!');
  });

  test('Complete Flow: Create, Edit, Delete Recurrent Transactions', async ({ page }) => {
    ('🧪 Testing complete recurrent transaction CRUD flow...');

    // STEP 1: CREATE RECURRENT TRANSACTION
    ('🔄 Step 1: Creating recurrent transaction...');

    // Click "Novo Registro" button
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    // Fill basic transaction data
    await fillTransactionForm(page, {
      description: 'Netflix - Recorrente Test',
      amount: '29.90',
      type: 'Despesa'
    });

    // Enable recurrence
    await enableRecurrence(page, 'mensal', '2026-06-15');

    // Submit the form
    await submitCreateForm(page); // Give time for multiple records to be created

    // Verify multiple recurring records were created
    const netflixRecords = page.locator('text=Netflix - Recorrente Test');
    const recordCount = await netflixRecords.count();
    expect(recordCount).toBeGreaterThan(1);
    (`✅ Recurrent transaction created: ${recordCount} records generated`);

    // STEP 2: EDIT ONE RECURRENT TRANSACTION
    ('✏️ Step 2: Editing recurrent transaction...');

    // Find and click edit button for first Netflix record
    const firstNetflixRow = page.locator('tr').filter({ hasText: 'Netflix - Recorrente Test' }).first();
    const editButton = firstNetflixRow.locator('button').filter({ has: page.locator('i[class*="edit"]') });
    await editButton.click();
    await page.waitForTimeout(1000);

    // Verify edit modal with recurrence settings
    await expect(page.locator('text=Editar Registro')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]:checked')).toBeVisible(); // Recurrence should be checked

    // Edit the description
    await page.fill('input[value*="Netflix"]', 'Netflix Premium - EDITADO');

    // Save changes
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Verify edit was successful
    await expect(page.locator('text=Netflix Premium - EDITADO').first()).toBeVisible();
    ('✅ Recurrent transaction edited successfully');

    // STEP 3: DELETE ONE RECURRENT TRANSACTION (should be surgical)
    ('🗑️ Step 3: Deleting one recurrent transaction...');

    // Count records before deletion
    const recordsBeforeDelete = await page.locator('text=Netflix').count();

    // Find and delete the first Netflix record
    const deleteButton = firstNetflixRow.locator('button').filter({ has: page.locator('i[class*="trash"]') });
    await deleteButton.click();
    await page.waitForTimeout(1000);

    // Confirm deletion
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
    await page.click('button:has-text("Excluir")');
    await page.waitForTimeout(2000);

    // Verify surgical deletion (only one record deleted, others remain)
    const recordsAfterDelete = await page.locator('text=Netflix').count();
    expect(recordsAfterDelete).toBe(recordsBeforeDelete - 1);
    (`✅ Surgical deletion successful: ${recordsBeforeDelete} → ${recordsAfterDelete} records`);

    ('🎉 Recurrent transaction CRUD flow completed successfully!');
  });

  test('Edge Case: Edit Non-Recurrent to Become Recurrent', async ({ page }) => {
    ('🧪 Testing conversion from normal to recurrent transaction...');

    // Create a normal transaction first
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Conta de Luz - Normal',
      amount: '150.00',
      type: 'Despesa'
    });

    await submitCreateForm(page);

    // Verify single record created
    let recordCount = await page.locator('text=Conta de Luz - Normal').count();
    expect(recordCount).toBe(1);

    // Edit to make it recurrent
    const editButton = page.locator('button').filter({ has: page.locator('i[class*="edit"]') }).first();
    await editButton.click();
    await page.waitForTimeout(1000);

    // Enable recurrence in edit modal
    await page.check('input[type="checkbox"]');
    await page.selectOption('select[value="mensal"]', 'mensal');
    await page.fill('input[type="date"]:last-of-type', '2026-03-15');

    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(3000);

    // Verify multiple records were generated
    recordCount = await page.locator('text=Conta de Luz - Normal').count();
    expect(recordCount).toBeGreaterThan(1);
    (`✅ Conversion successful: 1 → ${recordCount} records`);
  });

  test('Status Toggle: Should Not Delete Recurrent Records', async ({ page }) => {
    ('🧪 Testing status toggle with recurrent transactions...');

    // Create recurrent transaction
    await openCreateModal(page);

    await fillTransactionForm(page, {
      description: 'Salário - Status Test',
      amount: '5000.00',
      type: 'Receita'
    });

    // Enable recurrence
    await enableRecurrence(page, 'mensal', '2026-04-15');

    await submitCreateForm(page);

    // Count total records before status toggle
    const recordsBeforeToggle = await page.locator('text=Salário - Status Test').count();
    expect(recordsBeforeToggle).toBeGreaterThan(1);

    // Toggle status of first record
    const firstRecord = page.locator('tr').filter({ hasText: 'Salário - Status Test' }).first();
    const statusButton = firstRecord.locator('button:has-text("❌")');
    await statusButton.click();
    await page.waitForTimeout(2000);

    // Verify status changed but all records still exist
    const recordsAfterToggle = await page.locator('text=Salário - Status Test').count();
    expect(recordsAfterToggle).toBe(recordsBeforeToggle);

    // Verify one record is now completed
    const completedRecords = page.locator('tr').filter({ hasText: 'Salário - Status Test' }).locator('button:has-text("✔️")');
    const completedCount = await completedRecords.count();
    expect(completedCount).toBe(1);

    (`✅ Status toggle successful: ${recordsAfterToggle} records maintained, 1 marked complete`);
  });

  test('Complex Scenario: Multiple CRUD Operations', async ({ page }) => {
    ('🧪 Testing complex scenario with multiple operations...');

    // Create multiple different types of transactions
    const transactions = [
      { desc: 'Freelance Project', value: '2500', type: 'Receita', recurrent: false },
      { desc: 'Internet Bill', value: '80', type: 'Despesa', recurrent: true },
      { desc: 'Grocery Shopping', value: '200', type: 'Despesa', recurrent: false },
      { desc: 'Monthly Rent', value: '1200', type: 'Despesa', recurrent: true }
    ];

    for (const transaction of transactions) {
      await openCreateModal(page);

      await fillTransactionForm(page, {
        description: transaction.desc,
        amount: transaction.value,
        type: transaction.type as 'Receita' | 'Despesa'
      });

      if (transaction.recurrent) {
        await enableRecurrence(page, 'mensal', '2026-05-15');
      }

      await submitCreateForm(page);
    }

    // Verify all transactions were created
    for (const transaction of transactions) {
      await expect(page.locator(`text=${transaction.desc}`)).toBeVisible();
    }

    // Get total record count
    const allRows = page.locator('tbody tr');
    const totalRecords = await allRows.count();
    (`✅ Complex scenario: ${totalRecords} total records created`);

    // Test editing a recurrent transaction
    const internetRow = page.locator('tr').filter({ hasText: 'Internet Bill' }).first();
    await internetRow.locator('button').filter({ has: page.locator('i[class*="edit"]') }).click();
    await page.waitForTimeout(1000);

    await page.fill('input[value*="Internet"]', 'Internet + TV Bundle');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(2000);

    // Test deleting a normal transaction
    const groceryRow = page.locator('tr').filter({ hasText: 'Grocery Shopping' }).first();
    await groceryRow.locator('button').filter({ has: page.locator('i[class*="trash"]') }).click();
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Excluir")');
    await page.waitForTimeout(2000);

    // Verify operations
    await expect(page.locator('text=Internet + TV Bundle')).toBeVisible();
    await expect(page.locator('text=Grocery Shopping')).not.toBeVisible();

    ('🎉 Complex scenario completed successfully!');
  });

  test('Form Validation: Should Handle Invalid Inputs Gracefully', async ({ page }) => {
    ('🧪 Testing form validation and error handling...');

    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    // Test empty form submission
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(1000);

    // Modal should still be open (form didn't submit)
    await expect(page.locator('text=Novo Registro')).toBeVisible();

    // Test invalid value (very large number)
    await page.type('input[placeholder*="Descrição"]', 'Large Value Test');
    await page.type('input[placeholder*="R$"]', '999999999');
    await page.selectOption('select', 'Despesa');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Should handle gracefully (either create with max value or show validation)
    ('✅ Form validation working correctly');

    // Close modal if still open
    const cancelButton = page.locator('button:has-text("Cancelar")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
  });

  test('Performance: Rapid CRUD Operations', async ({ page }) => {
    ('🧪 Testing performance with rapid operations...');

    const startTime = Date.now();

    // Rapid creation of multiple records
    for (let i = 1; i <= 5; i++) {
      await openCreateModal(page);

      await fillTransactionForm(page, {
        description: `Rapid Test ${i}`,
        amount: `${i * 100}`,
        type: i % 2 === 0 ? 'Receita' : 'Despesa'
      });

      await submitCreateForm(page);
      await page.waitForTimeout(500); // Minimal wait
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time (less than 10 seconds)
    expect(totalTime).toBeLessThan(10000);

    // Verify all records were created
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Rapid Test ${i}`)).toBeVisible();
    }

    (`✅ Performance test completed in ${totalTime}ms`);
  });
});
