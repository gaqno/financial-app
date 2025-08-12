import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinanceStore } from '../../stores/financeStore'
import { useFinanceTableHelpers } from '../../composables/finance/useFinanceTableHelpers'
import type { IFinanceRecord } from '../../types/finance'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

describe('Toggle Status Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  const mockPendingRecord: IFinanceRecord = {
    Data: '2024-01-15',
    Descrição: 'Test Record',
    Valor: -100,
    Tipo: 'Despesa',
    Status: '❌',
    Categoria: 'Test Category'
  }

  const mockCompletedRecord: IFinanceRecord = {
    Data: '2024-01-16',
    Descrição: 'Completed Record',
    Valor: 200,
    Tipo: 'Receita',
    Status: '✔️',
    Categoria: 'Income Category'
  }

  describe('useFinanceTableHelpers - handleToggleStatus', () => {
    it('should toggle status from pending to completed', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      // Add a pending record to the store
      store.addRecord(mockPendingRecord)
      expect(store.records[0].Status).toBe('❌')

      // Toggle status
      handleToggleStatus(mockPendingRecord, 0)

      // Verify status changed to completed
      expect(store.records[0].Status).toBe('✔️')
    })

    it('should toggle status from completed to pending', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      // Add a completed record to the store
      store.addRecord(mockCompletedRecord)
      expect(store.records[0].Status).toBe('✔️')

      // Toggle status
      handleToggleStatus(mockCompletedRecord, 0)

      // Verify status changed to pending
      expect(store.records[0].Status).toBe('❌')
    })

    it('should find and update the correct record by properties match', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      // Add multiple records
      store.addRecord(mockPendingRecord)
      store.addRecord(mockCompletedRecord)

      expect(store.records).toHaveLength(2)
      expect(store.records[0].Status).toBe('❌')
      expect(store.records[1].Status).toBe('✔️')

      // Toggle the first record's status
      handleToggleStatus(mockPendingRecord, 0)

      // Verify only the first record changed
      expect(store.records[0].Status).toBe('✔️')
      expect(store.records[1].Status).toBe('✔️') // Second record unchanged
    })

    it('should handle case when record is not found', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      const nonExistentRecord: IFinanceRecord = {
        Data: '2024-01-20',
        Descrição: 'Non-existent Record',
        Valor: -50,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Unknown'
      }

      // Store should be empty
      expect(store.records).toHaveLength(0)

      // Try to toggle non-existent record - should not crash
      expect(() => {
        handleToggleStatus(nonExistentRecord, 0)
      }).not.toThrow()

      // Store should still be empty
      expect(store.records).toHaveLength(0)
    })
  })

  describe('Status Toggle Integration', () => {
    it('should maintain data integrity during status changes', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      const originalRecord: IFinanceRecord = {
        Data: '2024-01-15',
        Descrição: 'Integrity Test',
        Valor: -75,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Test'
      }

      store.addRecord(originalRecord)
      const recordBeforeToggle = { ...store.records[0] }

      handleToggleStatus(originalRecord, 0)

      const recordAfterToggle = store.records[0]

      // Only status should change, everything else should remain the same
      expect(recordAfterToggle.Data).toBe(recordBeforeToggle.Data)
      expect(recordAfterToggle.Descrição).toBe(recordBeforeToggle.Descrição)
      expect(recordAfterToggle.Valor).toBe(recordBeforeToggle.Valor)
      expect(recordAfterToggle.Tipo).toBe(recordBeforeToggle.Tipo)
      expect(recordAfterToggle.Categoria).toBe(recordBeforeToggle.Categoria)
      expect(recordAfterToggle.Status).not.toBe(recordBeforeToggle.Status)
      expect(recordAfterToggle.Status).toBe('✔️')
    })

    it('should handle multiple rapid toggles correctly', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      store.addRecord(mockPendingRecord)
      expect(store.records[0].Status).toBe('❌')

      // Toggle multiple times
      handleToggleStatus(mockPendingRecord, 0)
      expect(store.records[0].Status).toBe('✔️')

      handleToggleStatus({ ...mockPendingRecord, Status: '✔️' }, 0)
      expect(store.records[0].Status).toBe('❌')

      handleToggleStatus({ ...mockPendingRecord, Status: '❌' }, 0)
      expect(store.records[0].Status).toBe('✔️')
    })
  })

  describe('Status Toggle Performance', () => {
    it('should efficiently handle toggle operations on large datasets', () => {
      const store = useFinanceStore()
      const { handleToggleStatus } = useFinanceTableHelpers()

      // Add 100 records
      for (let i = 0; i < 100; i++) {
        const record: IFinanceRecord = {
          Data: `2024-01-${String(i + 1).padStart(2, '0')}`,
          Descrição: `Record ${i + 1}`,
          Valor: i % 2 === 0 ? -100 : 200,
          Tipo: i % 2 === 0 ? 'Despesa' : 'Receita',
          Status: '❌',
          Categoria: `Category ${i % 5}`
        }
        store.addRecord(record)
      }

      expect(store.records).toHaveLength(100)

      // Toggle the 50th record
      const targetRecord = store.records[49]
      const originalStatus = targetRecord.Status

      const start = performance.now()
      handleToggleStatus(targetRecord, 49)
      const end = performance.now()

      // Verify the operation completed quickly (less than 10ms)
      expect(end - start).toBeLessThan(10)

      // Verify only the target record changed
      expect(store.records[49].Status).toBe('✔️')
      expect(store.records[49].Status).not.toBe(originalStatus)
    })
  })
}) 