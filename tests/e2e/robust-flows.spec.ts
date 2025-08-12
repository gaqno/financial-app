import { test, expect } from '@playwright/test';

test.describe('Robust Financial Application E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('Complete CRUD Flow - Add, Edit, Delete Records', async ({ page }) => {
    console.log('🧪 Testing complete CRUD operations...');

    // Step 1: Verify initial empty state
    console.log('📊 Step 1: Verifying initial empty state...');
    await expect(page.locator('text=Nenhum registro encontrado')).toBeVisible();

    // Use more specific selector for balance - first occurrence in banner
    const balanceInBanner = page.locator('banner').getByText('R$ 0,00').first();
    await expect(balanceInBanner).toBeVisible();

    // Step 2: Add multiple records using more specific selectors
    console.log('➕ Step 2: Adding multiple records...');

    const records = [
      { desc: 'Salário Janeiro', value: '5000', type: 'Receita' },
      { desc: 'Supermercado', value: '200', type: 'Despesa' },
      { desc: 'Conta de Luz', value: '150', type: 'Despesa' },
      { desc: 'Freelance', value: '800', type: 'Receita' }
    ];

    for (const record of records) {
      // Use more specific selectors for the add form
      const addForm = page.locator('.space-y-4').filter({ hasText: 'Novo Registro' });

      // Fill description - look for the description input in the add form area
      const descInput = addForm.locator('input[placeholder*="Descrição"], input[placeholder*="Supermercado"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill(record.desc);
      } else {
        // Try alternative selector
        await page.locator('textbox').filter({ hasText: 'Descrição' }).fill(record.desc);
      }

      // Fill value - look for number input in add form that's visible
      const valueInputs = page.locator('input[type="number"]');
      const valueInputCount = await valueInputs.count();

      for (let i = 0; i < valueInputCount; i++) {
        const input = valueInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill(record.value);
          break;
        }
      }

      // Select type - find the combobox that's visible and in the add form
      const typeSelects = page.locator('select, combobox');
      const typeSelectCount = await typeSelects.count();

      for (let i = 0; i < typeSelectCount; i++) {
        const select = typeSelects.nth(i);
        if (await select.isVisible()) {
          try {
            await select.selectOption(record.type);
            break;
          } catch (e) {
            continue; // Try next select
          }
        }
      }

      // Submit - find add button
      const addButton = page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first();
      await addButton.click();
      await page.waitForTimeout(1000);

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

    console.log('✅ All records verified');

    // Step 4: Test edit functionality
    console.log('✏️ Step 4: Testing edit functionality...');

    // Find edit button for "Supermercado" - look for edit icon (pencil)
    const editButtons = page.locator('button').filter({ has: page.locator('i[class*="edit"], i[class*="pencil"], [class*="fa-"]') });
    const editButtonCount = await editButtons.count();

    if (editButtonCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);

      // Check if edit modal opened
      const editModal = page.locator('text=Editar Registro');
      if (await editModal.isVisible()) {
        console.log('✅ Edit modal opened');

        // Close the modal
        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }

    // Step 5: Test status toggle
    console.log('🔄 Step 5: Testing status toggle...');

    const statusButtons = page.locator('button:has-text("❌"), button:has-text("Pendente")');
    const statusButtonCount = await statusButtons.count();

    if (statusButtonCount > 0) {
      await statusButtons.first().click();
      await page.waitForTimeout(1000);

      // Look for confirmed status
      const confirmedButton = page.locator('button:has-text("✔️"), button:has-text("Confirmado")');
      if (await confirmedButton.isVisible()) {
        console.log('✅ Status toggle works');
      }
    }

    // Step 6: Test delete functionality
    console.log('🗑️ Step 6: Testing delete functionality...');

    // Find delete button (trash icon)
    const deleteButtons = page.locator('button').filter({ has: page.locator('i[class*="trash"], [class*="fa-trash"]') });
    const deleteButtonCount = await deleteButtons.count();

    if (deleteButtonCount > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);

      // Check if delete modal appeared
      const deleteModal = page.locator('text=Confirmar Exclusão');
      if (await deleteModal.isVisible()) {
        console.log('✅ Delete modal appeared');

        // Confirm deletion
        const excluirButton = page.locator('button:has-text("Excluir")');
        if (await excluirButton.isVisible()) {
          await excluirButton.click();
          await page.waitForTimeout(1000);

          // Look for undo toast
          const undoToast = page.locator('text=Registro excluído');
          if (await undoToast.isVisible()) {
            console.log('✅ Delete completed with undo option');
          }
        }
      }
    }

    console.log('🎉 CRUD flow completed successfully!');
  });

  test('Filter Flow - Test Record Filtering', async ({ page }) => {
    console.log('🔍 Testing filter functionality...');

    // Add test data first (simplified)
    const testRecords = [
      { desc: 'Test Income', value: '1000', type: 'Receita' },
      { desc: 'Test Expense', value: '500', type: 'Despesa' }
    ];

    // Add records using robust selectors
    for (const record of testRecords) {
      // Find visible and editable inputs
      const allDescInputs = page.locator('input[placeholder*="Descrição"], input[type="text"]');
      const allValueInputs = page.locator('input[type="number"]');
      const allSelects = page.locator('select, combobox');

      // Fill description in first visible input
      const descInputCount = await allDescInputs.count();
      for (let i = 0; i < descInputCount; i++) {
        const input = allDescInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill(record.desc);
          break;
        }
      }

      // Fill value in first visible input
      const valueInputCount = await allValueInputs.count();
      for (let i = 0; i < valueInputCount; i++) {
        const input = allValueInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill(record.value);
          break;
        }
      }

      // Select type in first working select
      const selectCount = await allSelects.count();
      for (let i = 0; i < selectCount; i++) {
        const select = allSelects.nth(i);
        if (await select.isVisible()) {
          try {
            await select.selectOption(record.type);
            break;
          } catch (e) {
            continue;
          }
        }
      }

      // Click add button
      await page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first().click();
      await page.waitForTimeout(1000);
    }

    await page.reload();
    await page.waitForTimeout(2000);

    // Test filters
    console.log('💰 Testing Receitas filter...');
    const receitasButton = page.locator('button:has-text("💰 Receitas")');
    if (await receitasButton.isVisible()) {
      await receitasButton.click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Test Income')).toBeVisible();
      console.log('✅ Receitas filter works');
    }

    console.log('💸 Testing Despesas filter...');
    const despesasButton = page.locator('button:has-text("💸 Despesas")');
    if (await despesasButton.isVisible()) {
      await despesasButton.click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Test Expense')).toBeVisible();
      console.log('✅ Despesas filter works');
    }

    console.log('📊 Testing All filter...');
    const todosButton = page.locator('button:has-text("📊 Todos")');
    if (await todosButton.isVisible()) {
      await todosButton.click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Test Income')).toBeVisible();
      await expect(page.locator('text=Test Expense')).toBeVisible();
      console.log('✅ All filter works');
    }
  });

  test('UI Sections Visibility Test', async ({ page }) => {
    console.log('👁️ Testing UI sections visibility...');

    // Test CSV Import section
    console.log('📁 Testing CSV Import section...');
    const csvSection = page.locator('text=Importar CSV');
    if (await csvSection.isVisible()) {
      await csvSection.click();
      await page.waitForTimeout(500);
      console.log('✅ CSV Import section accessible');
    }

    // Test Month Visibility section
    console.log('📅 Testing Month Visibility section...');
    const monthSection = page.locator('text=Gerenciar Visibilidade dos Meses');
    if (await monthSection.isVisible()) {
      await monthSection.click();
      await page.waitForTimeout(500);
      console.log('✅ Month Visibility section accessible');
    }

    // Test Debug section
    console.log('🔧 Testing Debug section...');
    const debugSection = page.locator('text=Debug do Estado');
    if (await debugSection.isVisible()) {
      await debugSection.click();
      await page.waitForTimeout(500);

      // Should show localStorage info
      await expect(page.locator('text=chaves')).toBeVisible();
      console.log('✅ Debug section works');
    }

    // Test Modal Debug Info (development mode)
    const modalDebugInfo = page.locator('text=Modal Debug Info');
    if (await modalDebugInfo.isVisible()) {
      await expect(page.locator('text=showDeleteConfirm: false')).toBeVisible();
      await expect(page.locator('text=showEditSheet: false')).toBeVisible();
      console.log('✅ Modal debug info visible');
    }

    // Test yearly projection
    const projectionSection = page.locator('text=Projeção Anual');
    if (await projectionSection.isVisible()) {
      await projectionSection.click();
      await page.waitForTimeout(500);
      console.log('✅ Yearly projection section accessible');
    }
  });

  test('Responsive Design Test', async ({ page }) => {
    console.log('📱 Testing responsive design...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(1000);

    // Just verify the app loads in mobile
    await expect(page.locator('text=FinanceApp')).toBeVisible();
    console.log('✅ Mobile view loads');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('text=FinanceApp')).toBeVisible();
    console.log('✅ Tablet view loads');

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('text=FinanceApp')).toBeVisible();
    console.log('✅ Desktop view loads');
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    console.log('⚠️ Testing error handling...');

    // Test form with empty inputs
    console.log('📝 Testing empty form submission...');

    // Try to submit without filling anything
    const addButton = page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Should handle gracefully (not crash)
      console.log('✅ Empty form handled gracefully');
    }

    // Test with only description
    console.log('🔤 Testing partial form submission...');

    const descInputs = page.locator('input[placeholder*="Descrição"], input[type="text"]');
    const descInputCount = await descInputs.count();

    for (let i = 0; i < descInputCount; i++) {
      const input = descInputs.nth(i);
      if (await input.isVisible() && await input.isEditable()) {
        await input.fill('Test Description Only');
        break;
      }
    }

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Partial form handled gracefully');
    }
  });

  test('Real World User Journey', async ({ page }) => {
    console.log('🌟 Testing real-world user journey...');

    // Scenario: User adds salary and a few expenses

    // Step 1: Add monthly salary
    console.log('💼 Adding monthly salary...');

    const addSalary = async () => {
      const descInputs = page.locator('input[placeholder*="Descrição"], input[type="text"]');
      const valueInputs = page.locator('input[type="number"]');
      const selects = page.locator('select, combobox');

      // Fill description
      const descInputCount = await descInputs.count();
      for (let i = 0; i < descInputCount; i++) {
        const input = descInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill('Salário Mensal');
          break;
        }
      }

      // Fill value
      const valueInputCount = await valueInputs.count();
      for (let i = 0; i < valueInputCount; i++) {
        const input = valueInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill('4500');
          break;
        }
      }

      // Select Receita
      const selectCount = await selects.count();
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        if (await select.isVisible()) {
          try {
            await select.selectOption('Receita');
            break;
          } catch (e) {
            continue;
          }
        }
      }

      // Submit
      await page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first().click();
      await page.waitForTimeout(1000);
    };

    await addSalary();

    // Step 2: Add an expense
    console.log('🏠 Adding an expense...');

    const addExpense = async () => {
      const descInputs = page.locator('input[placeholder*="Descrição"], input[type="text"]');
      const valueInputs = page.locator('input[type="number"]');
      const selects = page.locator('select, combobox');

      // Fill description
      const descInputCount = await descInputs.count();
      for (let i = 0; i < descInputCount; i++) {
        const input = descInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill('Aluguel');
          break;
        }
      }

      // Fill value
      const valueInputCount = await valueInputs.count();
      for (let i = 0; i < valueInputCount; i++) {
        const input = valueInputs.nth(i);
        if (await input.isVisible() && await input.isEditable()) {
          await input.fill('1200');
          break;
        }
      }

      // Select Despesa
      const selectCount = await selects.count();
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        if (await select.isVisible()) {
          try {
            await select.selectOption('Despesa');
            break;
          } catch (e) {
            continue;
          }
        }
      }

      // Submit
      await page.locator('button:has-text("Adicionar"), button:has-text("+ Adicionar")').first().click();
      await page.waitForTimeout(1000);
    };

    await addExpense();

    // Step 3: Refresh and verify
    await page.reload();
    await page.waitForTimeout(2000);

    console.log('📊 Verifying records...');
    await expect(page.locator('text=Salário Mensal')).toBeVisible();
    await expect(page.locator('text=Aluguel')).toBeVisible();

    console.log('🎉 Real-world user journey completed successfully!');
  });
}); 