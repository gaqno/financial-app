import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceStore } from '../../stores/financeStore'
import type { IFinanceRecord } from '../../types/finance'

// Mock localStorage
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Helper para configurar projeção inteligente para incluir dados de teste
const setupTestProjection = (store: any) => {
  store.updateProjectionSettings({
    includePastMonths: 6, // Incluir 6 meses passados para pegar dados de 2024
    includeFutureMonths: 3
  })
}

describe('Delete Flow Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Index Mapping in Filtered Data', () => {
    it('should correctly delete record from filtered/grouped data', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      // Add multiple records in different months
      const records: IFinanceRecord[] = [
        {
          Data: '2024-01-10',
          Descrição: 'Record 1',
          Valor: -100,
          Tipo: 'Despesa',
          Status: '❌',
          Categoria: 'Test'
        },
        {
          Data: '2024-01-15',
          Descrição: 'Record 2',
          Valor: -200,
          Tipo: 'Despesa',
          Status: '❌',
          Categoria: 'Test'
        },
        {
          Data: '2024-02-10',
          Descrição: 'Record 3',
          Valor: 300,
          Tipo: 'Receita',
          Status: '✔️',
          Categoria: 'Test'
        },
        {
          Data: '2024-01-20',
          Descrição: 'Record 4',
          Valor: -150,
          Tipo: 'Despesa',
          Status: '❌',
          Categoria: 'Test'
        }
      ]

      records.forEach(record => store.addRecord(record))

      expect(store.records).toHaveLength(4)

      // Get grouped data
      const grouped = store.groupedByMonth
      const jan2024Records = grouped['2024-01']

      expect(jan2024Records).toHaveLength(3)

      // Try to delete the second record in the January group
      // This should be "Record 2" but we need to find its actual index in the main array
      const recordToDelete = jan2024Records[1] // This might be "Record 2"

      // Find the correct index in the main records array
      const actualIndex = store.records.findIndex(r =>
        r.Data === recordToDelete.Data &&
        r.Descrição === recordToDelete.Descrição &&
        r.Valor === recordToDelete.Valor
      )

      expect(actualIndex).toBeGreaterThan(-1) // Should find the record

      // Simulate the delete flow
      store.confirmDelete(recordToDelete, actualIndex)
      const deleteResult = store.executeDelete()

      expect(deleteResult).toBe(true)
      expect(store.records).toHaveLength(3)

      // Verify the correct record was deleted
      const remainingRecords = store.records
      const deletedRecordStillExists = remainingRecords.some(r =>
        r.Data === recordToDelete.Data &&
        r.Descrição === recordToDelete.Descrição &&
        r.Valor === recordToDelete.Valor
      )

      expect(deletedRecordStillExists).toBe(false)
    })

    it('should handle delete when using display index vs actual index', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      // Add records from the same month (January 2025) with different dates
      store.addRecord({
        Data: '2025-01-15',
        Descrição: 'February Record',
        Valor: -200,
        Tipo: 'Despesa',
        Categoria: 'Test',
        Status: '❌'
      })

      store.addRecord({
        Data: '2025-01-10',
        Descrição: 'January Record 1',
        Valor: -100,
        Tipo: 'Despesa',
        Categoria: 'Test',
        Status: '❌'
      })

      store.addRecord({
        Data: '2025-01-20',
        Descrição: 'January Record 2',
        Valor: 150,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      const grouped = store.groupedByMonth
      const jan2025Records = grouped['2025-01']

      expect(jan2025Records).toHaveLength(3)

      // The display order might be different from storage order
      console.log('Storage order:', store.records.map(r => r.Descrição))
      console.log('Sort field:', store.sortField, 'Sort direction:', store.sortDirection)
      console.log('Sorted order:', jan2025Records.map(r => r.Descrição))

      // Delete the first item in sorted view
      const recordToDelete = jan2025Records[0]
      const actualIndex = store.records.findIndex(r =>
        r.Data === recordToDelete.Data &&
        r.Descrição === recordToDelete.Descrição &&
        r.Valor === recordToDelete.Valor
      )

      expect(actualIndex).toBeGreaterThanOrEqual(0)

      store.confirmDelete(recordToDelete, actualIndex)
      store.executeDelete()

      expect(store.records).toHaveLength(2)
    })

    it('should handle undo correctly after filtered delete', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      const testRecord = {
        Data: '2024-01-15',
        Descrição: 'Test Undo Record',
        Valor: -100,
        Tipo: 'Despesa' as const,
        Status: '❌' as const,
        Categoria: 'Test'
      }

      store.addRecord(testRecord)
      store.addRecord({
        Data: '2024-01-20',
        Descrição: 'Other Record',
        Valor: -200,
        Tipo: 'Despesa',
        Status: '❌'
      })

      expect(store.records).toHaveLength(2)

      // Delete the first record
      const actualIndex = store.records.findIndex(r => r.Descrição === 'Test Undo Record')
      store.confirmDelete(testRecord, actualIndex)
      store.executeDelete()

      expect(store.records).toHaveLength(1)
      expect(store.showUndoToast).toBe(true)

      // Undo the deletion
      store.undoDelete()

      expect(store.records).toHaveLength(2)
      expect(store.showUndoToast).toBe(false)

      // Verify the record was restored correctly
      const restoredRecord = store.records.find(r => r.Descrição === 'Test Undo Record')
      expect(restoredRecord).toBeTruthy()
      expect(restoredRecord).toMatchObject(testRecord)
    })
  })

  describe('Edge Cases', () => {
    it('should handle delete when record index changes due to sorting', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      // Add records in a specific order
      const records = [
        { Data: '2025-01-15', Descrição: 'A Record', Valor: -100, Tipo: 'Despesa' as const, Categoria: 'Test', Status: '❌' as const },
        { Data: '2025-01-10', Descrição: 'B Record', Valor: -200, Tipo: 'Despesa' as const, Categoria: 'Test', Status: '❌' as const },
        { Data: '2025-01-20', Descrição: 'C Record', Valor: -300, Tipo: 'Despesa' as const, Categoria: 'Test', Status: '❌' as const }
      ]

      records.forEach(record => store.addRecord(record))

      // Set descending sort by description (C, B, A)
      store.setSorting('Descrição', 'desc')

      const sortedData = store.sortedData
      expect(sortedData[0].Descrição).toBe('C Record')
      expect(sortedData[1].Descrição).toBe('B Record')
      expect(sortedData[2].Descrição).toBe('A Record')

      // Try to delete "B Record" which is at display index 1
      const recordToDelete = sortedData[1]
      const actualIndex = store.records.findIndex(r => r.Descrição === 'B Record')

      store.confirmDelete(recordToDelete, actualIndex)
      const result = store.executeDelete()

      expect(result).toBe(true)
      expect(store.records).toHaveLength(2)

      // Verify B Record is gone
      const bRecordExists = store.records.some(r => r.Descrição === 'B Record')
      expect(bRecordExists).toBe(false)
    })
  })
}) 