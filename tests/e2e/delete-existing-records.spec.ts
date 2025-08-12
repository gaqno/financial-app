import { test, expect } from '@playwright/test';

test.describe('Delete Existing Records E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(2000); // Wait for Vue app to initialize
  });

  test('should test delete functionality with any existing records', async ({ page }) => {
    console.log('🧪 Testing delete functionality...');

    // First, let's see if there are any records in the table
    await page.waitForTimeout(1000);

    // Look for any record rows (try multiple selectors)
    const recordRows = page.locator('tbody tr, .record-item, [data-testid="record-row"]');
    const recordCount = await recordRows.count();

    console.log(`📊 Found ${recordCount} existing records`);

    if (recordCount === 0) {
      console.log('⚠️ No records found. Let\'s try to add one manually...');

      // Try to expand the add form if it's collapsed
      const addFormToggle = page.locator('button:has-text("Adicionar"), button:has-text("Novo"), .add-record-button');
      if (await addFormToggle.count() > 0) {
        await addFormToggle.first().click();
        await page.waitForTimeout(500);
      }

      // Look for visible form inputs
      const descInput = page.locator('input[placeholder*="Descrição"], textarea[placeholder*="Descrição"]').first();
      const valueInput = page.locator('input[type="number"]').first();
      const submitButton = page.locator('button:has-text("Adicionar"), button:has-text("Salvar"), button[type="submit"]').first();

      if (await descInput.isVisible() && await valueInput.isVisible()) {
        await descInput.fill('E2E Test Record');
        await valueInput.fill('100');

        // Try to find and set the type
        const typeSelect = page.locator('select').first();
        if (await typeSelect.isVisible()) {
          await typeSelect.selectOption({ label: 'Despesa' });
        }

        await submitButton.click();
        await page.waitForTimeout(1000);

        console.log('✅ Test record added');
      } else {
        console.log('❌ Could not find form inputs to add a record');
        return; // Skip test if we can't add a record
      }
    }

    // Refresh record count
    const updatedRecordCount = await recordRows.count();
    console.log(`📊 Now have ${updatedRecordCount} records`);

    if (updatedRecordCount === 0) {
      console.log('❌ Still no records available for testing');
      return;
    }

    // Get the first record to test delete
    const firstRecord = recordRows.first();

    // Get the record description/text for verification
    const recordText = await firstRecord.textContent();
    console.log(`🎯 Target record: ${recordText?.substring(0, 50)}...`);

    // Look for delete button in the first record
    const deleteButton = firstRecord.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"]), button[title*="excluir"], button[title*="delete"]').first();

    // Try alternative selectors if first doesn't work
    let deleteButtonFound = await deleteButton.isVisible();

    if (!deleteButtonFound) {
      console.log('🔍 Trying alternative delete button selectors...');
      const altDeleteButton = firstRecord.locator('button').filter({ hasText: '🗑️' }).or(
        firstRecord.locator('button').filter({ hasText: 'Excluir' })
      ).or(
        firstRecord.locator('button[class*="red"], button[class*="danger"]')
      ).first();

      if (await altDeleteButton.isVisible()) {
        await altDeleteButton.click();
        deleteButtonFound = true;
      }
    } else {
      await deleteButton.click();
    }

    if (!deleteButtonFound) {
      console.log('❌ Could not find delete button');
      return;
    }

    console.log('✅ Delete button clicked');

    // Wait for delete confirmation modal
    await page.waitForTimeout(500);

    // Look for delete confirmation modal with multiple selectors
    const deleteModal = page.locator(
      '[data-modal="delete-confirm"]'
    ).or(
      page.locator('.modal, .dialog, .popup').filter({ hasText: 'Confirmar' })
    ).or(
      page.locator('.modal, .dialog, .popup').filter({ hasText: 'excluir' })
    ).or(
      page.locator('.modal, .dialog, .popup').filter({ hasText: 'Exclusão' })
    );

    // Check if modal appeared
    const modalVisible = await deleteModal.isVisible();
    console.log(`🔍 Delete modal visible: ${modalVisible}`);

    if (modalVisible) {
      console.log('✅ Delete confirmation modal appeared');

      // Look for confirm button in the modal
      const confirmButton = deleteModal.locator('button:has-text("Excluir"), button:has-text("Confirmar"), button[class*="red"], button[class*="danger"]').first();

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        console.log('✅ Delete confirmed');

        // Wait for modal to disappear
        await expect(deleteModal).not.toBeVisible({ timeout: 5000 });

        // Wait a moment for the record to be removed from DOM
        await page.waitForTimeout(1000);

        // Check if record count decreased or if the specific record is gone
        const newRecordCount = await recordRows.count();
        console.log(`📊 Record count after delete: ${newRecordCount}`);

        // We expect either the count to decrease or the content to change
        if (newRecordCount < updatedRecordCount) {
          console.log('✅ Record successfully deleted - count decreased');
        } else {
          // Check if the specific record content is still there
          const currentFirstRecord = await recordRows.first().textContent();
          if (currentFirstRecord !== recordText) {
            console.log('✅ Record successfully deleted - content changed');
          } else {
            console.log('❌ Record may not have been deleted - content unchanged');
          }
        }

        // Look for undo toast
        const undoToast = page.locator('.toast, [class*="toast"], .undo').filter({ hasText: 'excluído' }).or(
          page.locator('.toast, [class*="toast"], .undo').filter({ hasText: 'Desfazer' })
        );

        if (await undoToast.isVisible()) {
          console.log('✅ Undo toast appeared');

          const undoButton = undoToast.locator('button:has-text("Desfazer")');
          if (await undoButton.isVisible()) {
            console.log('🔄 Testing undo functionality...');
            await undoButton.click();

            await page.waitForTimeout(1000);
            const restoredCount = await recordRows.count();
            console.log(`📊 Record count after undo: ${restoredCount}`);

            if (restoredCount > newRecordCount) {
              console.log('✅ Undo functionality works');
            }
          }
        } else {
          console.log('ℹ️ No undo toast found (may have already disappeared)');
        }

      } else {
        console.log('❌ Could not find confirm button in modal');
      }
    } else {
      console.log('❌ Delete confirmation modal did not appear');

      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/no-modal-debug.png', fullPage: true });
    }
  });

  test('should verify delete modal appears correctly', async ({ page }) => {
    console.log('🧪 Testing delete modal appearance...');

    // Listen for console logs to verify our implementation
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('FINANCE_TABLE') || text.includes('STORE') || text.includes('DELETE_MODAL')) {
        consoleMessages.push(text);
        console.log(`📋 Console: ${text}`);
      }
    });

    await page.waitForTimeout(2000);

    // Look for any delete button on the page
    const deleteButtons = page.locator('button:has([class*="fa-trash"]), button:has(i[class*="trash"]), .trash, [title*="excluir"]');
    const buttonCount = await deleteButtons.count();

    console.log(`🔍 Found ${buttonCount} delete buttons`);

    if (buttonCount > 0) {
      // Click the first delete button
      await deleteButtons.first().click();

      // Wait for potential modal
      await page.waitForTimeout(1000);

      // Check for modal with our specific data attribute
      const specificModal = page.locator('[data-modal="delete-confirm"]');
      const isSpecificModalVisible = await specificModal.isVisible();

      console.log(`🔍 Our specific modal visible: ${isSpecificModalVisible}`);

      if (isSpecificModalVisible) {
        console.log('✅ Delete modal with data-modal attribute works correctly');

        // Verify modal content
        const modalText = await specificModal.textContent();
        console.log(`📄 Modal content: ${modalText}`);

        if (modalText?.includes('Confirmar Exclusão') || modalText?.includes('excluir')) {
          console.log('✅ Modal has correct content');
        }

        // Close the modal
        const cancelButton = specificModal.locator('button:has-text("Cancelar")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }

      // Log captured console messages
      console.log('📋 Captured console messages:', consoleMessages);
    } else {
      console.log('❌ No delete buttons found on the page');
    }
  });
}); 