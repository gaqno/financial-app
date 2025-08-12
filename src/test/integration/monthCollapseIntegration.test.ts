import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceStore } from '../../stores/financeStore'
import { useFinanceTableHelpers } from '../../composables/finance/useFinanceTableHelpers'
import type { IFinanceRecord } from '../../types/finance'

// Mock localStorage globally for this test file
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Helper para configurar projeção inteligente para incluir dados de teste
const setupTestProjection = (store: any) => {
  store.updateProjectionSettings({
    includePastMonths: 6, // Incluir 6 meses passados para pegar dados de 2024
    includeFutureMonths: 3
  })
}

describe('Month Collapse Integration Tests', () => {
  let financeStore: ReturnType<typeof useFinanceStore>
  let helpers: ReturnType<typeof useFinanceTableHelpers>

  // Sample test data
  const sampleRecords: IFinanceRecord[] = [
    {
      Data: '2025-01-15',
      Descrição: 'Janeiro Record 1',
      Valor: 1000,
      Tipo: 'Receita',
      Status: '✔️',
      Categoria: 'Renda'
    },
    {
      Data: '2025-01-20',
      Descrição: 'Janeiro Record 2',
      Valor: -500,
      Tipo: 'Despesa',
      Status: '❌',
      Categoria: 'Alimentação'
    },
    {
      Data: '2025-02-10',
      Descrição: 'Fevereiro Record 1',
      Valor: 2000,
      Tipo: 'Receita',
      Status: '✔️',
      Categoria: 'Renda'
    },
    {
      Data: '2025-03-05',
      Descrição: 'Março Record 1',
      Valor: -300,
      Tipo: 'Despesa',
      Status: '❌',
      Categoria: 'Transporte'
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    financeStore = useFinanceStore()
    helpers = useFinanceTableHelpers()

    // Clear localStorage mocks
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()

    // Add sample data to store
    sampleRecords.forEach(record => financeStore.addRecord(record))
  })

  describe('Collapse State with CRUD Operations', () => {
    it('should maintain collapse state when adding records', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      // Add initial records to create month groups
      store.addRecord({
        Data: '2025-01-15',
        Descrição: 'January Record 1',
        Valor: -100,
        Tipo: 'Despesa',
        Categoria: 'Test',
        Status: '❌'
      })

      store.addRecord({
        Data: '2025-01-20',
        Descrição: 'January Record 2',
        Valor: 200,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      // Collapse January 2025
      helpers.handleMonthToggle('2025-01', true)
      expect(helpers.collapsedMonths.value.has('2025-01')).toBe(true)

      // Add another record to January
      store.addRecord({
        Data: '2025-01-25',
        Descrição: 'January Record 3',
        Valor: 50,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      // Verify record was added
      const januaryRecords = financeStore.groupedByMonth['2025-01']
      expect(januaryRecords).toBeDefined()
      expect(januaryRecords.length).toBe(3) // 2 original + 1 new

      // Verify collapse state is maintained
      expect(helpers.collapsedMonths.value.has('2025-01')).toBe(true)
    })

    it('should maintain collapse state when editing records', () => {
      const monthKey = '2025-02'

      // Collapse February
      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Edit the February record
      const recordIndex = financeStore.records.findIndex(r => r.Data === '2025-02-10')
      expect(recordIndex).toBeGreaterThan(-1)

      const success = financeStore.updateRecord(recordIndex, {
        Descrição: 'Updated Fevereiro Record',
        Valor: 2500
      })

      expect(success).toBe(true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Verify record was updated
      const updatedRecord = financeStore.records[recordIndex]
      expect(updatedRecord.Descrição).toBe('Updated Fevereiro Record')
      expect(updatedRecord.Valor).toBe(2500)
    })

    it('should maintain collapse state when deleting records', () => {
      const monthKey = '2025-03'

      // Collapse March
      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Delete the March record
      const recordIndex = financeStore.records.findIndex(r => r.Data === '2025-03-05')
      expect(recordIndex).toBeGreaterThan(-1)

      const success = financeStore.removeRecord(recordIndex)
      expect(success).toBe(true)

      // Collapse state should be maintained even if month becomes empty
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Verify record was deleted (month should be empty or not exist)
      const marchRecords = financeStore.groupedByMonth['2025-03']
      expect(marchRecords || []).toHaveLength(0)
    })

    it('should handle status toggle without affecting collapse state', () => {
      const monthKey = '2025-01'

      // Collapse January
      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Find a record to toggle
      const recordToToggle = financeStore.records.find(r => r.Data === '2025-01-20')
      expect(recordToToggle).toBeDefined()

      if (recordToToggle) {
        const originalStatus = recordToToggle.Status
        const displayIndex = 1 // Mock display index

        // Toggle status
        helpers.handleToggleStatus(recordToToggle, displayIndex)

        // Collapse state should be maintained
        expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

        // Status should have been toggled
        const updatedRecord = financeStore.records.find(r => r.Data === '2025-01-20')
        expect(updatedRecord?.Status).not.toBe(originalStatus)
      }
    })
  })

  describe('Multi-Month Collapse Scenarios', () => {
    it('should handle multiple months collapsed independently', () => {
      const jan = '2025-01'
      const feb = '2025-02'
      const mar = '2025-03'

      // Collapse January and March, leave February expanded
      helpers.handleMonthToggle(jan, true)
      helpers.handleMonthToggle(mar, true)

      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)
      expect(helpers.collapsedMonths.value.has(feb)).toBe(false)
      expect(helpers.collapsedMonths.value.has(mar)).toBe(true)

      // Add records to each month
      financeStore.addRecord({
        Data: '2025-01-30',
        Descrição: 'Late January',
        Valor: -100,
        Tipo: 'Despesa',
        Status: '❌'
      })

      financeStore.addRecord({
        Data: '2025-02-28',
        Descrição: 'Late February',
        Valor: 300,
        Tipo: 'Receita',
        Status: '✔️'
      })

      // Collapse states should remain independent
      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)
      expect(helpers.collapsedMonths.value.has(feb)).toBe(false)
      expect(helpers.collapsedMonths.value.has(mar)).toBe(true)
    })

    it('should preserve collapse state across filter changes', () => {
      const jan = '2025-01'
      const feb = '2025-02'

      // Collapse January
      helpers.handleMonthToggle(jan, true)
      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)

      // Apply filter to show only Receitas
      financeStore.setFilter('Receita')

      // Collapse state should be preserved
      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)

      // Apply filter to show only Despesas
      financeStore.setFilter('Despesa')

      // Collapse state should still be preserved
      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)

      // Reset filter
      financeStore.setFilter('all')

      // Collapse state should still be preserved
      expect(helpers.collapsedMonths.value.has(jan)).toBe(true)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()

      // Generate many records across multiple months
      const largeDataset: IFinanceRecord[] = []
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 30; day++) {
          largeDataset.push({
            Data: `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
            Descrição: `Record ${month}-${day}`,
            Valor: Math.random() > 0.5 ? 100 : -100,
            Tipo: Math.random() > 0.5 ? 'Receita' : 'Despesa',
            Status: Math.random() > 0.5 ? '✔️' : '❌'
          })
        }
      }

      // Add all records
      largeDataset.forEach(record => financeStore.addRecord(record))

      // Collapse all months
      for (let month = 1; month <= 12; month++) {
        const monthKey = `2025-${month.toString().padStart(2, '0')}`
        helpers.handleMonthToggle(monthKey, true)
      }

      const endTime = performance.now()

      // Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000)

      // All months should be collapsed
      expect(helpers.collapsedMonths.value.size).toBe(12)
    })

    it('should handle empty months gracefully', () => {
      // Clear all data
      financeStore.clearAllData()

      // Try to collapse non-existent months
      const nonExistentMonths = ['2024-12', '2025-04', '2025-05']

      nonExistentMonths.forEach(monthKey => {
        expect(() => {
          helpers.handleMonthToggle(monthKey, true)
          helpers.handleMonthToggle(monthKey, false)
        }).not.toThrow()
      })

      // Should maintain state even for non-existent months
      helpers.handleMonthToggle('2025-04', true)
      expect(helpers.collapsedMonths.value.has('2025-04')).toBe(true)
    })

    it('should handle rapid toggle operations', () => {
      const monthKey = '2025-01'

      // Rapidly toggle the same month many times
      for (let i = 0; i < 100; i++) {
        helpers.handleMonthToggle(monthKey, i % 2 === 0)
      }

      // Final state should be expanded (100 is even, so last toggle was false)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)

      // Set should not have accumulated duplicates
      expect(helpers.collapsedMonths.value.size).toBeLessThanOrEqual(1)
    })
  })

  describe('Month Display Name Formatting', () => {
    it('should format month keys to Portuguese month names', () => {
      // This would be tested in the component test, but we can verify the logic
      const testCases = [
        { key: '2025-01', expected: 'janeiro de 2025' },
        { key: '2025-02', expected: 'fevereiro de 2025' },
        { key: '2025-12', expected: 'dezembro de 2025' }
      ]

      testCases.forEach(({ key, expected }) => {
        const [year, month] = key.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        const formatted = date.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        })
        expect(formatted.toLowerCase()).toBe(expected)
      })
    })
  })
}) 