import { test, expect } from '@playwright/test'
import { loginWithDemo } from './auth-helper';

test.describe('Recurrence Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })

    // Login with demo credentials
    await loginWithDemo(page);
  })

  test('should generate recurring records when editing a non-recurring record to become recurring', async ({ page }) => {
    // Step 1: Add a single (non-recurring) record
    await test.step('Add initial record', async () => {
      // Click "Novo Registro" button to open modal
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000); // Wait for modal to open

      // Fill the form
      await page.fill('input[type="date"]', '2025-01-15')
      await page.fill('input[placeholder*="Descrição"]', 'Teste Recorrência')
      await page.fill('input[placeholder*="R$"]', '1000')
      await page.selectOption('select', 'Receita')
      await page.fill('input[placeholder*="Categoria"]', 'Salário')

      // Submit the form
      await page.click('button:has-text("Criar")')

      // Wait for the record to appear
      await page.waitForSelector('text=Teste Recorrência')
    })

    // Step 2: Verify only one record exists initially
    await test.step('Verify single record exists', async () => {
      const records = await page.locator('[data-testid="finance-record"]').count()
      expect(records).toBe(1)
    })

    // Step 3: Edit the record to make it recurring
    await test.step('Edit record to add recurrence', async () => {
      // Click edit button on the record
      await page.click('[data-testid="edit-record-button"]')

      // Wait for edit modal to open
      await page.waitForSelector('[data-testid="edit-modal"]')

      // Enable recurrence
      await page.check('[data-testid="recurrence-checkbox"]')

      // Set recurrence frequency to monthly
      await page.selectOption('[data-testid="recurrence-frequency-select"]', 'mensal')

      // Set end date to 3 months from now
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      await page.fill('[data-testid="recurrence-end-date"]', endDate.toISOString().split('T')[0])

      // Save the edit
      await page.click('[data-testid="save-edit-button"]')

      // Wait for modal to close
      await page.waitForTimeout(1000) // Wait for modal to close
    })

    // Step 4: Verify multiple recurring records were created
    await test.step('Verify recurring records were generated', async () => {
      // Wait a moment for records to be generated
      await page.waitForTimeout(1000)

      // Count the total records - should be more than 1 now
      const totalRecords = await page.locator('[data-testid="finance-record"]').count()
      expect(totalRecords).toBeGreaterThan(1)

      // Verify we have at least 3-4 records (original + 2-3 future months)
      expect(totalRecords).toBeGreaterThanOrEqual(3)

      // Verify all records have the same description
      const descriptions = await page.locator('[data-testid="record-description"]').allTextContents()
      descriptions.forEach(desc => {
        expect(desc).toContain('Teste Recorrência')
      })
    })

    // Step 5: Verify records have proper recurrence metadata
    await test.step('Verify recurrence metadata', async () => {
      // Check that records have recurrence indicators
      const recurrenceIndicators = await page.locator('[data-testid="recurrence-indicator"]').count()
      expect(recurrenceIndicators).toBeGreaterThan(0)

      // Verify records appear in different months
      const recordDates = await page.locator('[data-testid="record-date"]').allTextContents()
      const uniqueMonths = new Set(recordDates.map(date => {
        const parsed = new Date(date)
        return `${parsed.getFullYear()}-${parsed.getMonth()}`
      }))

      // Should have records spanning multiple months
      expect(uniqueMonths.size).toBeGreaterThan(1)
    })
  })

  test('should update all linked records when editing one record in a recurrence chain', async ({ page }) => {
    // Step 1: Create a recurring record series
    await test.step('Create recurring series', async () => {
      // Click "Novo Registro" button to open modal
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000); // Wait for modal to open

      // Fill form with recurrence enabled
      await page.fill('input[type="date"]', '2025-01-15')
      await page.fill('input[placeholder*="Descrição"]', 'Série Recorrente')
      await page.fill('input[placeholder*="R$"]', '500')
      await page.selectOption('select', 'Despesa')

      // Enable recurrence
      await page.check('input[type="checkbox"]')
      await page.selectOption('select:near(text="Frequência")', 'mensal')

      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 2)
      // Find and fill the end date input (should be the second date input)
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.nth(1).fill(endDate.toISOString().split('T')[0]);

      await page.click('button:has-text("Criar")')
      await page.waitForTimeout(1000)
    })

    // Step 2: Edit one record in the series
    await test.step('Edit one record in series', async () => {
      // Click edit on first record
      await page.click('[data-testid="edit-record-button"]')
      await page.waitForSelector('[data-testid="edit-modal"]')

      // Change the description
      await page.fill('[data-testid="edit-description-input"]', 'Série Modificada')

      // Save the edit
      await page.click('[data-testid="save-edit-button"]')

      // Should see confirmation dialog asking if user wants to update all linked records
      await page.waitForSelector('[data-testid="update-all-confirmation"]')
      await page.click('[data-testid="confirm-update-all"]')

      await page.waitForTimeout(1000) // Wait for modal to close
    })

    // Step 3: Verify all records in series were updated
    await test.step('Verify all records updated', async () => {
      const descriptions = await page.locator('[data-testid="record-description"]').allTextContents()
      descriptions.forEach(desc => {
        expect(desc).toContain('Série Modificada')
      })
    })
  })

  test('should respect business day recurrence when editing', async ({ page }) => {
    // Test that editing a record to use business day recurrence properly calculates business days
    await test.step('Create business day recurring record', async () => {
      // Click "Novo Registro" button to open modal
      await page.click('button:has-text("Novo Registro")');
      await page.waitForTimeout(1000); // Wait for modal to open

      // Use a date that falls on a business day (5th business day of month)
      await page.fill('input[type="date"]', '2025-01-07') // Should be 5th business day
      await page.fill('input[placeholder*="Descrição"]', 'Pagamento Business Day')
      await page.fill('input[placeholder*="R$"]', '2000')

      // Enable business day recurrence through edit
      await page.click('button:has-text("Criar")')
      await page.waitForTimeout(500)

      // Edit to add recurrence  
      await page.click('button:has(i.fa-edit)') // Edit button icon
      await page.waitForTimeout(1000) // Wait for edit modal

      await page.check('input[type="checkbox"]')
      await page.selectOption('select:near(text="Frequência")', 'mensal')

      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 2)
      // Find and fill the end date input (should be the second date input)
      const dateInputs = page.locator('input[type="date"]');
      await dateInputs.nth(1).fill(endDate.toISOString().split('T')[0]);

      await page.click('button:has-text("Salvar")')
      await page.waitForTimeout(1000) // Wait for modal to close
    })

    // Step 2: Verify business day pattern is maintained
    await test.step('Verify business day pattern', async () => {
      await page.waitForTimeout(1000)

      const recordDates = await page.locator('[data-testid="record-date"]').allTextContents()
      expect(recordDates.length).toBeGreaterThan(1)

      // Each date should be a business day (Monday-Friday)
      recordDates.forEach(dateStr => {
        const date = new Date(dateStr)
        const dayOfWeek = date.getDay()
        expect(dayOfWeek).toBeGreaterThanOrEqual(1) // Monday
        expect(dayOfWeek).toBeLessThanOrEqual(5) // Friday
      })
    })
  })
}) 