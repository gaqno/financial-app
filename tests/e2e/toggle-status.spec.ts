import { test, expect } from '@playwright/test'

test.describe('Toggle Status Functionality - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the application to load
    await page.waitForSelector('[data-testid="finance-table"]', { timeout: 10000 })
  })

  test('should toggle record status from pending to completed', async ({ page }) => {
    // Add a test record first
    await page.click('[data-testid="add-record-button"]')

    // Fill out the form
    await page.fill('[data-testid="description-input"]', 'E2E Toggle Test')
    await page.fill('[data-testid="value-input"]', '100')
    await page.selectOption('[data-testid="type-select"]', 'Despesa')
    await page.fill('[data-testid="category-input"]', 'Test Category')

    // Submit the form
    await page.click('[data-testid="submit-button"]')

    // Wait for the record to appear in the table
    await page.waitForSelector('text=E2E Toggle Test')

    // Find the status button for this record (should be pending initially)
    const statusButton = page.locator('tr:has-text("E2E Toggle Test") button:has-text("Pendente")')

    // Verify initial status is pending
    await expect(statusButton).toBeVisible()
    await expect(statusButton).toHaveClass(/bg-orange-100/)

    // Click to toggle status
    await statusButton.click()

    // Verify status changed to completed
    const completedButton = page.locator('tr:has-text("E2E Toggle Test") button:has-text("Concluído")')
    await expect(completedButton).toBeVisible()
    await expect(completedButton).toHaveClass(/bg-green-100/)

    // Verify the row styling changed (should be grayed out)
    const recordRow = page.locator('tr:has-text("E2E Toggle Test")')
    await expect(recordRow).toHaveClass(/bg-gray-50/)
  })

  test('should toggle record status from completed back to pending', async ({ page }) => {
    // Add a test record and immediately mark it as completed
    await page.click('[data-testid="add-record-button"]')

    await page.fill('[data-testid="description-input"]', 'Complete to Pending Test')
    await page.fill('[data-testid="value-input"]', '50')
    await page.selectOption('[data-testid="type-select"]', 'Receita')

    await page.click('[data-testid="submit-button"]')
    await page.waitForSelector('text=Complete to Pending Test')

    // First toggle to completed
    let statusButton = page.locator('tr:has-text("Complete to Pending Test") button:has-text("Pendente")')
    await statusButton.click()

    // Verify it's now completed
    let completedButton = page.locator('tr:has-text("Complete to Pending Test") button:has-text("Concluído")')
    await expect(completedButton).toBeVisible()

    // Toggle back to pending
    await completedButton.click()

    // Verify it's back to pending
    statusButton = page.locator('tr:has-text("Complete to Pending Test") button:has-text("Pendente")')
    await expect(statusButton).toBeVisible()
    await expect(statusButton).toHaveClass(/bg-orange-100/)
  })

  test('should show correct hover states for status buttons', async ({ page }) => {
    // Add a test record
    await page.click('[data-testid="add-record-button"]')

    await page.fill('[data-testid="description-input"]', 'Hover Test Record')
    await page.fill('[data-testid="value-input"]', '25')
    await page.selectOption('[data-testid="type-select"]', 'Despesa')

    await page.click('[data-testid="submit-button"]')
    await page.waitForSelector('text=Hover Test Record')

    const statusButton = page.locator('tr:has-text("Hover Test Record") button:has-text("Pendente")')

    // Hover over the status button
    await statusButton.hover()

    // Check that hover effects are applied (scale transform)
    await expect(statusButton).toHaveClass(/hover:scale-105/)

    // Check the title attribute shows correct toggle instruction
    await expect(statusButton).toHaveAttribute('title', 'Clique para marcar como concluído')
  })

  test('should maintain record data integrity during status toggle', async ({ page }) => {
    // Add a record with specific data
    await page.click('[data-testid="add-record-button"]')

    const testData = {
      description: 'Data Integrity Test',
      value: '123.45',
      type: 'Receita',
      category: 'Salary'
    }

    await page.fill('[data-testid="description-input"]', testData.description)
    await page.fill('[data-testid="value-input"]', testData.value)
    await page.selectOption('[data-testid="type-select"]', testData.type)
    await page.fill('[data-testid="category-input"]', testData.category)

    await page.click('[data-testid="submit-button"]')
    await page.waitForSelector(`text=${testData.description}`)

    // Verify initial data
    const recordRow = page.locator(`tr:has-text("${testData.description}")`)
    await expect(recordRow).toContainText(testData.description)
    await expect(recordRow).toContainText('R$ 123,45')
    await expect(recordRow).toContainText('💰 Receita')
    await expect(recordRow).toContainText(testData.category)

    // Toggle status
    const statusButton = recordRow.locator('button:has-text("Pendente")')
    await statusButton.click()

    // Verify data is still the same after toggle, only status changed
    await expect(recordRow).toContainText(testData.description)
    await expect(recordRow).toContainText('R$ 123,45')
    await expect(recordRow).toContainText('💰 Receita')
    await expect(recordRow).toContainText(testData.category)
    await expect(recordRow.locator('button:has-text("Concluído")')).toBeVisible()
  })

  test('should work correctly on mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Add a test record
    await page.click('[data-testid="add-record-button"]')

    await page.fill('[data-testid="description-input"]', 'Mobile Toggle Test')
    await page.fill('[data-testid="value-input"]', '75')
    await page.selectOption('[data-testid="type-select"]', 'Despesa')

    await page.click('[data-testid="submit-button"]')
    await page.waitForSelector('text=Mobile Toggle Test')

    // In mobile view, records should be displayed as cards
    const mobileCard = page.locator('[data-testid="mobile-record-card"]:has-text("Mobile Toggle Test")')
    await expect(mobileCard).toBeVisible()

    // Find and click the status button in the mobile card
    const mobileStatusButton = mobileCard.locator('button:has-text("Pendente")')
    await expect(mobileStatusButton).toBeVisible()

    await mobileStatusButton.click()

    // Verify status changed in mobile view
    const mobileCompletedButton = mobileCard.locator('button:has-text("Concluído")')
    await expect(mobileCompletedButton).toBeVisible()
    await expect(mobileCompletedButton).toHaveClass(/bg-green-100/)
  })
}) 