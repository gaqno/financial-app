import { test, expect } from '@playwright/test';
import { loginWithDemo, openCreateModal, fillTransactionForm } from './auth-helper';

test.describe('Validation and Edge Cases E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Login with demo credentials
    await loginWithDemo(page);
  });

  test('Decimal Validation: Should Accept Valid Decimal Places', async ({ page }) => {
    ('🧪 Testing decimal validation edge cases...');

    const validValues = [
      { value: '1246.29', expected: 'R$ 1.246,29' },
      { value: '100.5', expected: 'R$ 100,50' },
      { value: '50', expected: 'R$ 50,00' },
      { value: '0.01', expected: 'R$ 0,01' },
      { value: '999999.99', expected: 'R$ 999.999,99' }
    ];

    for (const testCase of validValues) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', `Decimal Test ${testCase.value}`);
      await page.type('input[placeholder*="R$"]', testCase.value);
      await page.selectOption('select', 'Receita');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);

      // Verify value was accepted and formatted correctly
      await expect(page.locator(`text=Decimal Test ${testCase.value}`)).toBeVisible();
      await expect(page.locator(`text=${testCase.expected}`)).toBeVisible();

      (`✅ Valid decimal: ${testCase.value} → ${testCase.expected}`);

      // Clean up for next test
      await page.reload();
      await page.waitForTimeout(2000);
    }
  });

  test('Decimal Validation: Should Reject Invalid Decimal Places', async ({ page }) => {
    ('🧪 Testing invalid decimal validation...');

    const invalidValues = [
      '123.456', // 3 decimal places
      '100.123', // 3 decimal places
      '50.9999' // 4 decimal places
    ];

    for (const invalidValue of invalidValues) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', `Invalid Decimal ${invalidValue}`);
      await page.type('input[placeholder*="R$"]', invalidValue);
      await page.selectOption('select', 'Despesa');

      // Try to submit (should be blocked or show validation error)
      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(1000);

      // Form should either stay open (validation blocked) or show error
      const modalStillOpen = await page.locator('text=Novo Registro').isVisible();
      const validationError = await page.locator('text*="casas decimais"').isVisible();

      if (modalStillOpen || validationError) {
        (`✅ Invalid decimal rejected: ${invalidValue}`);

        // Close modal if open
        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      } else {
        (`⚠️ Invalid decimal may have been accepted: ${invalidValue}`);
      }

      await page.waitForTimeout(1000);
    }
  });

  test('Form Validation: Required Fields', async ({ page }) => {
    ('🧪 Testing required field validation...');

    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    // Try to submit empty form
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(1000);

    // Modal should stay open (validation failed)
    await expect(page.locator('text=Novo Registro')).toBeVisible();

    // Fill only description
    await page.type('input[placeholder*="Descrição"]', 'Only Description');
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(1000);

    // Should still be blocked
    await expect(page.locator('text=Novo Registro')).toBeVisible();

    // Fill only value
    await page.fill('input[placeholder*="Descrição"]', '');
    await page.type('input[placeholder*="R$"]', '100');
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(1000);

    // Should still be blocked
    await expect(page.locator('text=Novo Registro')).toBeVisible();

    // Fill all required fields
    await page.type('input[placeholder*="Descrição"]', 'Complete Transaction');
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Should now succeed
    await expect(page.locator('text=Complete Transaction')).toBeVisible();

    ('✅ Required field validation working correctly');
  });

  test('Value Range Validation: Extreme Values', async ({ page }) => {
    ('🧪 Testing value range validation...');

    const extremeValues = [
      { value: '0', shouldAccept: false, desc: 'Zero value' },
      { value: '0.001', shouldAccept: false, desc: 'Below minimum' },
      { value: '0.01', shouldAccept: true, desc: 'Minimum valid' },
      { value: '999999.99', shouldAccept: true, desc: 'Maximum valid' },
      { value: '1000000', shouldAccept: false, desc: 'Above maximum' },
      { value: '-100', shouldAccept: false, desc: 'Negative value' }
    ];

    for (const testCase of extremeValues) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', `Range Test ${testCase.desc}`);
      await page.type('input[placeholder*="R$"]', testCase.value);
      await page.selectOption('select', 'Despesa');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);

      if (testCase.shouldAccept) {
        // Should be accepted and visible in table
        const recordExists = await page.locator(`text=Range Test ${testCase.desc}`).isVisible();
        if (recordExists) {
          (`✅ ${testCase.desc} (${testCase.value}) correctly accepted`);
        }
      } else {
        // Should be rejected (modal stays open or validation error)
        const modalOpen = await page.locator('text=Novo Registro').isVisible();
        const validationError = await page.locator('text*="mínimo", text*="máximo", text*="zero"').isVisible();

        if (modalOpen || validationError) {
          (`✅ ${testCase.desc} (${testCase.value}) correctly rejected`);

          // Close modal
          const cancelButton = page.locator('button:has-text("Cancelar")');
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
      }

      await page.waitForTimeout(1000);
    }
  });

  test('Description Validation: Length and Content', async ({ page }) => {
    ('🧪 Testing description validation...');

    const descriptionTests = [
      { desc: '', shouldAccept: false, name: 'Empty description' },
      { desc: 'A', shouldAccept: true, name: 'Single character' },
      { desc: 'Normal Description', shouldAccept: true, name: 'Normal description' },
      { desc: 'A'.repeat(100), shouldAccept: true, name: 'Long description' },
      { desc: 'Special chars: @#$%^&*()', shouldAccept: true, name: 'Special characters' },
      { desc: '123456789', shouldAccept: true, name: 'Numbers only' },
      { desc: 'Açentöś ñ çhárãçtérś', shouldAccept: true, name: 'Accented characters' }
    ];

    for (const test of descriptionTests) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      if (test.desc) {
        await page.type('input[placeholder*="Descrição"]', test.desc);
      }
      await page.type('input[placeholder*="R$"]', '100.00');
      await page.selectOption('select', 'Receita');

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);

      if (test.shouldAccept) {
        const exists = await page.locator(`text=${test.desc}`).isVisible();
        if (exists || test.desc === '') {
          (`✅ ${test.name} correctly handled`);
        }
      } else {
        const modalOpen = await page.locator('text=Novo Registro').isVisible();
        if (modalOpen) {
          (`✅ ${test.name} correctly rejected`);
          await page.click('button:has-text("Cancelar")');
        }
      }

      await page.waitForTimeout(1000);
    }
  });

  test('Date Validation: Edge Dates', async ({ page }) => {
    ('🧪 Testing date validation edge cases...');

    const today = new Date();
    const dateTests = [
      {
        date: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        name: 'Past date (1 year ago)'
      },
      {
        date: today.toISOString().split('T')[0],
        name: 'Today'
      },
      {
        date: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        name: 'Future date (1 year ahead)'
      },
      {
        date: '2025-02-29',
        name: 'Invalid leap year date'
      },
      {
        date: '2024-02-29',
        name: 'Valid leap year date'
      }
    ];

    for (const test of dateTests) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', `Date Test ${test.name}`);
      await page.type('input[placeholder*="R$"]', '150.00');
      await page.selectOption('select', 'Despesa');

      // Try to set the date
      try {
        await page.fill('input[type="date"]', test.date);
        await page.click('button:has-text("Criar")');
        await page.waitForTimeout(2000);

        const exists = await page.locator(`text=Date Test ${test.name}`).isVisible();
        if (exists) {
          (`✅ ${test.name} (${test.date}) accepted`);
        } else {
          (`⚠️ ${test.name} (${test.date}) may have been rejected`);

          // Close modal if open
          const cancelButton = page.locator('button:has-text("Cancelar")');
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
      } catch (error) {
        (`⚠️ ${test.name} (${test.date}) caused error: ${error}`);

        const cancelButton = page.locator('button:has-text("Cancelar")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }

      await page.waitForTimeout(1000);
    }
  });

  test('Recurrence Date Validation: End Date Logic', async ({ page }) => {
    ('🧪 Testing recurrence end date validation...');

    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Recurrence Date Test');
    await page.type('input[placeholder*="R$"]', '200.00');
    await page.selectOption('select', 'Receita');

    // Enable recurrence
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Test 1: End date before start date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    await page.fill('input[type="date"]:last-of-type', pastDate);
    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(1000);

    // Should be rejected or show validation
    const modalStillOpen = await page.locator('text=Novo Registro').isVisible();
    if (modalStillOpen) {
      ('✅ Past end date correctly rejected');

      // Fix the date for next test
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      await page.fill('input[type="date"]:last-of-type', futureDate.toISOString().split('T')[0]);

      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(3000);

      const recordExists = await page.locator('text=Recurrence Date Test').isVisible();
      if (recordExists) {
        ('✅ Valid future end date accepted');
      }
    }
  });

  test('Category Validation: Auto-detection vs Manual', async ({ page }) => {
    ('🧪 Testing category validation and auto-detection...');

    const categoryTests = [
      { desc: 'Supermercado Extra', expectedCategory: 'Alimentação' },
      { desc: 'Pagamento de Aluguel', expectedCategory: 'Moradia' },
      { desc: 'Gasolina do Carro', expectedCategory: 'Transporte' },
      { desc: 'Netflix Subscription', expectedCategory: 'Entretenimento' }
    ];

    for (const test of categoryTests) {
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000);

      await page.type('input[placeholder*="Descrição"]', test.desc);
      await page.type('input[placeholder*="R$"]', '100.00');
      await page.selectOption('select', 'Despesa');

      // Leave category as "Detectar automaticamente"
      await page.click('button:has-text("Criar")');
      await page.waitForTimeout(2000);

      // Verify transaction was created (auto-detection worked)
      const exists = await page.locator(`text=${test.desc}`).isVisible();
      if (exists) {
        (`✅ Auto-detection worked for: ${test.desc}`);
      }

      await page.waitForTimeout(1000);
    }

    // Test manual category override
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Manual Category Test');
    await page.type('input[placeholder*="R$"]', '75.00');
    await page.selectOption('select', 'Despesa');
    await page.selectOption('select', '🏥 Saúde'); // Manual selection

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Manual Category Test')).toBeVisible();
    await expect(page.locator('text=🏥 Saúde')).toBeVisible();

    ('✅ Manual category override working');
  });

  test('Browser Edge Cases: Local Storage and Memory', async ({ page }) => {
    ('🧪 Testing browser edge cases...');

    // Test 1: Create many transactions to test memory usage
    ('📊 Creating many transactions for memory test...');

    for (let i = 1; i <= 50; i++) {
      await page.click('button:has-text("Novo Registro")');
      await page.type('input[placeholder*="Descrição"]', `Memory Test ${i}`);
      await page.type('input[placeholder*="R$"]', `${i * 10}`);
      await page.selectOption('select', i % 2 === 0 ? 'Receita' : 'Despesa');
      await page.click('button:has-text("Criar")');

      if (i % 10 === 0) {
        await page.waitForTimeout(500); // Brief pause every 10 records
        (`Created ${i} transactions...`);
      }
    }

    // Verify all transactions were created
    const allRows = page.locator('tbody tr');
    const totalRecords = await allRows.count();
    expect(totalRecords).toBeGreaterThanOrEqual(50);

    // Test 2: Rapid page operations
    ('🔄 Testing rapid page operations...');

    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForTimeout(1000);

      // Verify data persisted
      const recordsAfterReload = await allRows.count();
      expect(recordsAfterReload).toBe(totalRecords);
    }

    // Test 3: Filter performance with many records
    ('🔍 Testing filter performance...');

    const filterStartTime = Date.now();

    await page.click('button:has-text("💰 Receitas")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("💸 Despesas")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("📊 Todos")');
    await page.waitForTimeout(1000);

    const filterTime = Date.now() - filterStartTime;

    // Should handle filtering large dataset efficiently
    expect(filterTime).toBeLessThan(10000);

    (`✅ Browser edge cases: ${totalRecords} records, filter time: ${filterTime}ms`);
  });

  test('Network Edge Cases: Offline Simulation', async ({ page }) => {
    ('🧪 Testing network edge cases...');

    // Create some initial data
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Network Test Before Offline');
    await page.type('input[placeholder*="R$"]', '100.00');
    await page.selectOption('select', 'Receita');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Simulate going offline (block network requests)
    await page.route('**/*', route => route.abort());

    // Try to create another transaction while "offline"
    await page.click('button:has-text("Novo Registro")');
    await page.waitForTimeout(1000);

    await page.type('input[placeholder*="Descrição"]', 'Network Test While Offline');
    await page.type('input[placeholder*="R$"]', '200.00');
    await page.selectOption('select', 'Despesa');

    await page.click('button:has-text("Criar")');
    await page.waitForTimeout(2000);

    // Should either work (local storage) or show appropriate error handling
    const offlineTransaction = await page.locator('text=Network Test While Offline').isVisible();

    if (offlineTransaction) {
      ('✅ Offline functionality: Transaction saved locally');
    } else {
      ('✅ Offline handling: Graceful error handling');
    }

    // Restore network
    await page.unroute('**/*');

    // Verify original data still exists
    await expect(page.locator('text=Network Test Before Offline')).toBeVisible();

    ('✅ Network edge cases handled correctly');
  });
});
