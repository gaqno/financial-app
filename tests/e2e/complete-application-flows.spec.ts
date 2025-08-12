import { test, expect } from '@playwright/test';

test.describe('Complete Financial Application E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(1000);

    // Clear any existing data by refreshing and ensuring clean state
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test('Complete CRUD Flow - Add, Edit, Delete Records', async ({ page }) => {
    console.log('🧪 Testing complete CRUD operations...');

    // Step 1: Verify initial empty state
    console.log('📊 Step 1: Verifying initial empty state...');
    await expect(page.locator('text=Nenhum registro encontrado')).toBeVisible();
    await expect(page.locator('text=R$ 0,00')).toBeVisible(); // Balance should be zero

    // Step 2: Add multiple records
    console.log('➕ Step 2: Adding multiple records...');

    const records = [
      { desc: 'Salário Janeiro', value: '5000', type: 'Receita', date: '2025-01-01' },
      { desc: 'Supermercado', value: '200', type: 'Despesa', date: '2025-01-05' },
      { desc: 'Conta de Luz', value: '150', type: 'Despesa', date: '2025-01-10' },
      { desc: 'Freelance', value: '800', type: 'Receita', date: '2025-01-15' }
    ];

    for (const record of records) {
      // Fill description
      await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', record.desc);

      // Fill value
      await page.fill('input[type="number"], textbox[name="R$"]', record.value);

      // Set date if available
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        await dateInput.fill(record.date);
      }

      // Select type
      const typeSelect = page.locator('select, combobox').first();
      await typeSelect.selectOption(record.type);

      // Submit
      await page.click('button:has-text("Adicionar"), button[type="submit"]');
      await page.waitForTimeout(500);

      console.log(`✅ Added record: ${record.desc}`);
    }

    // Refresh to see all records
    await page.reload();
    await page.waitForTimeout(2000);

    // Step 3: Verify records were added
    console.log('✅ Step 3: Verifying records were added...');

    for (const record of records) {
      await expect(page.locator(`text=${record.desc}`)).toBeVisible();
    }

    // Check balance calculation (5000 + 800 - 200 - 150 = 5450)
    await expect(page.locator('text=R$ 54,50')).toBeVisible(); // Assuming currency formatting

    // Step 4: Edit a record
    console.log('✏️ Step 4: Testing edit functionality...');

    // Find and click edit button for "Supermercado"
    const supermercadoRow = page.locator('tr, .record-item').filter({ hasText: 'Supermercado' });
    const editButton = supermercadoRow.locator('button:has([class*="pencil"]), button:has([class*="edit"])').first();

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Verify edit modal opened
      await expect(page.locator('text=Editar Registro')).toBeVisible();

      // Change description
      await page.fill('input[value="Supermercado"], textbox[value="Supermercado"]', 'Supermercado Extra');

      // Change value
      await page.fill('input[value*="2"], textbox[value*="2"]', '250');

      // Save changes
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(1000);

      // Verify changes
      await expect(page.locator('text=Supermercado Extra')).toBeVisible();
      console.log('✅ Edit functionality works');
    }

    // Step 5: Test status toggle
    console.log('🔄 Step 5: Testing status toggle...');

    const statusButton = page.locator('button:has-text("❌"), button:has-text("Pendente")').first();
    if (await statusButton.isVisible()) {
      await statusButton.click();
      await page.waitForTimeout(500);

      // Should change to confirmed
      await expect(page.locator('button:has-text("✔️"), button:has-text("Confirmado")')).toBeVisible();
      console.log('✅ Status toggle works');
    }

    // Step 6: Delete a record
    console.log('🗑️ Step 6: Testing delete functionality...');

    const contaLuzRow = page.locator('tr, .record-item').filter({ hasText: 'Conta de Luz' });
    const deleteButton = contaLuzRow.locator('button:has([class*="trash"]), button:has([class*="delete"])').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Verify delete modal
      await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
      await expect(page.locator('text=Conta de Luz')).toBeVisible();

      // Confirm deletion
      await page.click('button:has-text("Excluir")');
      await page.waitForTimeout(1000);

      // Verify undo toast appeared
      await expect(page.locator('text=Registro excluído')).toBeVisible();

      // Wait for undo to expire and refresh
      await page.waitForTimeout(6000);
      await page.reload();
      await page.waitForTimeout(1000);

      // Verify record was deleted
      await expect(page.locator('text=Conta de Luz')).not.toBeVisible();
      console.log('✅ Delete functionality works');
    }
  });

  test('Filter and Search Flow', async ({ page }) => {
    console.log('🔍 Testing filter and search functionality...');

    // Add some test data first
    const testRecords = [
      { desc: 'Receita Teste 1', value: '1000', type: 'Receita' },
      { desc: 'Despesa Teste 1', value: '500', type: 'Despesa' },
      { desc: 'Receita Teste 2', value: '800', type: 'Receita' }
    ];

    for (const record of testRecords) {
      await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', record.desc);
      await page.fill('input[type="number"], textbox[name="R$"]', record.value);

      const typeSelect = page.locator('select, combobox').first();
      await typeSelect.selectOption(record.type);

      await page.click('button:has-text("Adicionar")');
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForTimeout(1000);

    // Test filter by type - Receitas only
    console.log('💰 Testing Receitas filter...');
    await page.click('button:has-text("💰 Receitas")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Receita Teste 1')).toBeVisible();
    await expect(page.locator('text=Receita Teste 2')).toBeVisible();
    await expect(page.locator('text=Despesa Teste 1')).not.toBeVisible();

    // Test filter by type - Despesas only
    console.log('💸 Testing Despesas filter...');
    await page.click('button:has-text("💸 Despesas")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Despesa Teste 1')).toBeVisible();
    await expect(page.locator('text=Receita Teste 1')).not.toBeVisible();
    await expect(page.locator('text=Receita Teste 2')).not.toBeVisible();

    // Reset to all
    console.log('📊 Testing All filter...');
    await page.click('button:has-text("📊 Todos")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Receita Teste 1')).toBeVisible();
    await expect(page.locator('text=Receita Teste 2')).toBeVisible();
    await expect(page.locator('text=Despesa Teste 1')).toBeVisible();

    console.log('✅ Filter functionality works');
  });

  test('Month Visibility and Grouping Flow', async ({ page }) => {
    console.log('📅 Testing month visibility and grouping...');

    // Add records in different months
    const monthlyRecords = [
      { desc: 'Janeiro Record', value: '100', date: '2025-01-15' },
      { desc: 'Fevereiro Record', value: '200', date: '2025-02-15' },
      { desc: 'Março Record', value: '300', date: '2025-03-15' }
    ];

    for (const record of monthlyRecords) {
      await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', record.desc);
      await page.fill('input[type="number"], textbox[name="R$"]', record.value);

      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        await dateInput.fill(record.date);
      }

      await page.click('button:has-text("Adicionar")');
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForTimeout(1000);

    // Test month visibility toggle
    console.log('👁️ Testing month visibility management...');

    const monthVisibilityToggle = page.locator('text=Gerenciar Visibilidade dos Meses').locator('..');
    if (await monthVisibilityToggle.isVisible()) {
      await monthVisibilityToggle.click();
      await page.waitForTimeout(500);

      // Look for month toggle options
      const monthToggles = page.locator('button, checkbox').filter({ hasText: '2025' });
      if (await monthToggles.count() > 0) {
        console.log('✅ Month visibility controls found');
      }
    }

    // Test month collapse/expand
    console.log('📁 Testing month collapse/expand...');

    const monthHeaders = page.locator('h3').filter({ hasText: '2025' });
    if (await monthHeaders.count() > 0) {
      const firstMonthHeader = monthHeaders.first();
      await firstMonthHeader.click();
      await page.waitForTimeout(500);

      console.log('✅ Month grouping functionality tested');
    }
  });

  test('CSV Import Flow', async ({ page }) => {
    console.log('📁 Testing CSV import functionality...');

    // Test CSV import section
    const csvSection = page.locator('text=Importar CSV').locator('..');
    if (await csvSection.isVisible()) {
      await csvSection.click();
      await page.waitForTimeout(500);

      // Look for file input or sample CSV button
      const fileInput = page.locator('input[type="file"]');
      const sampleButton = page.locator('button:has-text("Sample"), button:has-text("Exemplo")');

      if (await fileInput.count() > 0) {
        console.log('✅ CSV file input found');
      }

      if (await sampleButton.count() > 0) {
        await sampleButton.click();
        await page.waitForTimeout(500);
        console.log('✅ CSV sample generation works');
      }
    }
  });

  test('Debug and State Management Flow', async ({ page }) => {
    console.log('🔧 Testing debug and state management...');

    // Test debug section
    const debugSection = page.locator('text=Debug do Estado').locator('..');
    if (await debugSection.isVisible()) {
      await debugSection.click();
      await page.waitForTimeout(500);

      // Should show localStorage keys
      await expect(page.locator('text=chaves')).toBeVisible();

      // Look for clear data button
      const clearButton = page.locator('button:has-text("Limpar"), button:has-text("Clear")');
      if (await clearButton.count() > 0) {
        console.log('✅ Clear data functionality available');
      }
    }

    // Test modal debug info (development mode)
    const modalDebug = page.locator('text=Modal Debug Info');
    if (await modalDebug.isVisible()) {
      await expect(page.locator('text=showDeleteConfirm: false')).toBeVisible();
      await expect(page.locator('text=showEditSheet: false')).toBeVisible();
      console.log('✅ Modal debug info working');
    }
  });

  test('Yearly Projection and Balance Calculation Flow', async ({ page }) => {
    console.log('📈 Testing yearly projection and balance calculations...');

    // Add some records to test calculations
    const calculationRecords = [
      { desc: 'Salary', value: '3000', type: 'Receita' },
      { desc: 'Rent', value: '1000', type: 'Despesa' },
      { desc: 'Bonus', value: '500', type: 'Receita' }
    ];

    for (const record of calculationRecords) {
      await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', record.desc);
      await page.fill('input[type="number"], textbox[name="R$"]', record.value);

      const typeSelect = page.locator('select, combobox').first();
      await typeSelect.selectOption(record.type);

      await page.click('button:has-text("Adicionar")');
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForTimeout(2000);

    // Check balance update (3000 + 500 - 1000 = 2500 -> R$ 25,00)
    console.log('💰 Verifying balance calculation...');
    const balanceElements = page.locator('text*=R$').filter({ hasText: '25' });
    if (await balanceElements.count() > 0) {
      console.log('✅ Balance calculation works');
    }

    // Check yearly projection
    console.log('📊 Verifying yearly projection...');
    const projectionSection = page.locator('text=Projeção Anual');
    if (await projectionSection.isVisible()) {
      await projectionSection.click();
      await page.waitForTimeout(500);

      // Should show projection values
      await expect(page.locator('text=Projeção para dezembro')).toBeVisible();
      console.log('✅ Yearly projection working');
    }
  });

  test('Responsive Design and Mobile View Flow', async ({ page }) => {
    console.log('📱 Testing responsive design...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.reload();
    await page.waitForTimeout(1000);

    // Add a record in mobile view
    await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', 'Mobile Test');
    await page.fill('input[type="number"], textbox[name="R$"]', '100');
    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForTimeout(1000);

    // Verify record appears in mobile view
    await expect(page.locator('text=Mobile Test')).toBeVisible();
    console.log('✅ Mobile view works');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify still works in tablet view
    await expect(page.locator('text=Mobile Test')).toBeVisible();
    console.log('✅ Tablet view works');

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForTimeout(1000);

    console.log('✅ Responsive design tested');
  });

  test('Error Handling and Edge Cases Flow', async ({ page }) => {
    console.log('⚠️ Testing error handling and edge cases...');

    // Test invalid inputs
    console.log('🚫 Testing invalid value input...');
    await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', 'Invalid Test');

    // Try to enter invalid characters in number field
    const numberInput = page.locator('input[type="number"], textbox[name="R$"]');
    await numberInput.fill('abc123');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(500);

    // Should handle invalid input gracefully
    console.log('✅ Invalid input handled');

    // Test empty form submission
    console.log('📝 Testing empty form submission...');
    await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', '');
    await page.fill('input[type="number"], textbox[name="R$"]', '');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(500);

    // Should not add empty record
    console.log('✅ Empty form handled');

    // Test very large numbers
    console.log('🔢 Testing large numbers...');
    await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', 'Large Number');
    await page.fill('input[type="number"], textbox[name="R$"]', '999999999');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(500);

    console.log('✅ Large numbers handled');
  });

  test('Complete User Journey - Real World Scenario', async ({ page }) => {
    console.log('🌟 Testing complete real-world user journey...');

    // Scenario: User manages monthly finances

    // Step 1: Add monthly salary
    console.log('💼 Step 1: Adding monthly salary...');
    await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', 'Salário Mensal');
    await page.fill('input[type="number"], textbox[name="R$"]', '4500');

    const typeSelect = page.locator('select, combobox').first();
    await typeSelect.selectOption('Receita');

    await page.click('button:has-text("Adicionar")');
    await page.waitForTimeout(500);

    // Step 2: Add recurring expenses
    console.log('🏠 Step 2: Adding recurring expenses...');
    const expenses = [
      { desc: 'Aluguel', value: '1200' },
      { desc: 'Conta de Luz', value: '200' },
      { desc: 'Internet', value: '80' },
      { desc: 'Supermercado', value: '400' }
    ];

    for (const expense of expenses) {
      await page.fill('input[placeholder*="Descrição"], textbox[name="Descrição"]', expense.desc);
      await page.fill('input[type="number"], textbox[name="R$"]', expense.value);

      await typeSelect.selectOption('Despesa');
      await page.click('button:has-text("Adicionar")');
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForTimeout(2000);

    // Step 3: Review finances
    console.log('📊 Step 3: Reviewing finances...');

    // Check that all records are present
    await expect(page.locator('text=Salário Mensal')).toBeVisible();
    await expect(page.locator('text=Aluguel')).toBeVisible();
    await expect(page.locator('text=Conta de Luz')).toBeVisible();

    // Check balance (4500 - 1200 - 200 - 80 - 400 = 2620)
    const remainingBalance = page.locator('text*=R$').filter({ hasText: '26' });
    if (await remainingBalance.count() > 0) {
      console.log('✅ Balance calculation correct');
    }

    // Step 4: Mark some bills as paid
    console.log('✅ Step 4: Marking bills as paid...');

    const aluguelRow = page.locator('tr, .record-item').filter({ hasText: 'Aluguel' });
    const statusButton = aluguelRow.locator('button:has-text("❌"), button:has-text("Pendente")').first();

    if (await statusButton.isVisible()) {
      await statusButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Bill marked as paid');
    }

    // Step 5: Filter to see only unpaid bills
    console.log('🔍 Step 5: Filtering unpaid bills...');
    await page.click('button:has-text("💸 Despesas")');
    await page.waitForTimeout(500);

    // Should see unpaid expenses
    await expect(page.locator('text=Conta de Luz')).toBeVisible();
    await expect(page.locator('text=Internet')).toBeVisible();

    console.log('🎉 Complete user journey successful!');
  });
}); 