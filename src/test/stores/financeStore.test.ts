import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
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

describe('FinanceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Helper para configurar projeção inteligente para incluir dados de teste
  const setupTestProjection = (store: any) => {
    store.updateProjectionSettings({
      includePastMonths: 6, // Incluir 6 meses passados para pegar dados de 2024
      includeFutureMonths: 3
    })
  }

  const mockRecord: IFinanceRecord = {
    Data: '2024-01-15',
    Descrição: 'Test Record',
    Valor: -100,
    Tipo: 'Despesa',
    Status: '❌',
    Categoria: 'Test Category'
  }

  describe('Record Management', () => {
    it('should add a record successfully', () => {
      const store = useFinanceStore()

      const result = store.addRecord(mockRecord)

      expect(result).toBe(true)
      expect(store.records).toHaveLength(1)
      expect(store.records[0]).toMatchObject(mockRecord)
    })

    it('should update a record successfully', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)

      const updatedData = { Descrição: 'Updated Record', Valor: -150 }
      const result = store.updateRecord(0, updatedData)

      expect(result).toBe(true)
      expect(store.records[0].Descrição).toBe('Updated Record')
      expect(store.records[0].Valor).toBe(-150)
    })

    it('should remove a record successfully', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)

      const result = store.removeRecord(0)

      expect(result).toBe(true)
      expect(store.records).toHaveLength(0)
    })

    it('should handle invalid index for removal', () => {
      const store = useFinanceStore()

      const result = store.removeRecord(99)

      expect(result).toBe(false)
    })

    it('should handle invalid index for update', () => {
      const store = useFinanceStore()

      const result = store.updateRecord(99, { Descrição: 'Test' })

      expect(result).toBe(false)
    })
  })

  describe('Delete Modal Functionality', () => {
    it('should show delete confirmation', () => {
      const store = useFinanceStore()

      store.confirmDelete(mockRecord, 0)

      expect(store.showDeleteConfirm).toBe(true)
      expect(store.itemToDelete).toEqual({ record: mockRecord, index: 0 })
    })

    it('should cancel delete operation', () => {
      const store = useFinanceStore()
      store.confirmDelete(mockRecord, 0)

      store.cancelDelete()

      expect(store.showDeleteConfirm).toBe(false)
      expect(store.itemToDelete).toBe(null)
    })

    it('should execute delete successfully', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)
      store.confirmDelete(mockRecord, 0)

      const result = store.executeDelete()

      expect(result).toBe(true)
      expect(store.records).toHaveLength(0)
      expect(store.showDeleteConfirm).toBe(false)
      expect(store.showUndoToast).toBe(true)
      expect(store.deletedItem).toBeTruthy()
    })

    it('should handle delete with no item selected', () => {
      const store = useFinanceStore()

      const result = store.executeDelete()

      expect(result).toBe(false)
    })
  })

  describe('Edit Modal Functionality', () => {
    it('should start edit successfully', () => {
      const store = useFinanceStore()

      store.startEdit(mockRecord, 0)

      expect(store.showEditSheet).toBe(true)
      expect(store.editingRecord).toEqual(mockRecord)
      expect(store.originalEditIndex).toBe(0)
    })

    it('should close edit sheet', () => {
      const store = useFinanceStore()
      store.startEdit(mockRecord, 0)

      store.closeEditSheet()

      expect(store.showEditSheet).toBe(false)
      expect(store.editingRecord).toBe(null)
      expect(store.originalEditIndex).toBe(-1)
    })

    it('should save edit successfully', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)
      store.startEdit(mockRecord, 0)

      // Modify the editing record
      store.editingRecord!.Descrição = 'Edited Description'

      const result = store.saveEdit()

      expect(result).toBe(true)
      expect(store.records[0].Descrição).toBe('Edited Description')
      expect(store.showEditSheet).toBe(false)
    })

    it('should handle save with no editing record', () => {
      const store = useFinanceStore()

      const result = store.saveEdit()

      expect(result).toBe(false)
    })
  })

  describe('Undo Functionality', () => {
    it('should undo delete successfully', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)
      store.confirmDelete(mockRecord, 0)
      store.executeDelete()

      store.undoDelete()

      expect(store.records).toHaveLength(1)
      expect(store.records[0]).toMatchObject(mockRecord)
      expect(store.showUndoToast).toBe(false)
      expect(store.deletedItem).toBe(null)
    })

    it('should handle undo with no deleted item', () => {
      const store = useFinanceStore()

      // Should not throw error
      store.undoDelete()

      expect(store.records).toHaveLength(0)
    })

    it('should hide undo toast', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)
      store.confirmDelete(mockRecord, 0)
      store.executeDelete()

      store.hideUndoToast()

      expect(store.showUndoToast).toBe(false)
      expect(store.deletedItem).toBe(null)
      expect(store.undoTimeLeft).toBe(0)
    })
  })

  describe('Filtering and Grouping', () => {
    it('should filter records by type', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      store.addRecord({
        Data: '2024-01-15',
        Descrição: 'Test Expense',
        Valor: -100,
        Tipo: 'Despesa',
        Categoria: 'Test',
        Status: '❌'
      })

      store.addRecord({
        Data: '2024-01-16',
        Descrição: 'Test Income',
        Valor: 200,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      store.setFilter('Despesa')

      expect(store.filteredData).toHaveLength(1)
      expect(store.filteredData[0].Tipo).toBe('Despesa')
    })

    it('should group records by month', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      store.addRecord({
        Data: '2024-01-15',
        Descrição: 'January Record 1',
        Valor: -100,
        Tipo: 'Despesa',
        Categoria: 'Test',
        Status: '❌'
      })

      store.addRecord({
        Data: '2024-01-20',
        Descrição: 'January Record 2',
        Valor: 150,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      store.addRecord({
        Data: '2024-02-05',
        Descrição: 'February Record',
        Valor: 200,
        Tipo: 'Receita',
        Categoria: 'Test',
        Status: '✔️'
      })

      const grouped = store.groupedByMonth

      expect(Object.keys(grouped)).toContain('2024-01')
      expect(Object.keys(grouped)).toContain('2024-02')
      expect(grouped['2024-01']).toHaveLength(2)
      expect(grouped['2024-02']).toHaveLength(1)
    })

    it('should calculate correct final balance', () => {
      const store = useFinanceStore()
      setupTestProjection(store) // Configurar projeção para incluir dados de teste

      store.addRecord({ Data: '2024-01-15', Descrição: 'Test 1', Valor: -100, Tipo: 'Despesa', Categoria: 'Test', Status: '❌' })
      store.addRecord({ Data: '2024-01-16', Descrição: 'Test 2', Valor: 200, Tipo: 'Receita', Categoria: 'Test', Status: '✔️' })
      store.addRecord({ Data: '2024-01-17', Descrição: 'Test 3', Valor: 150, Tipo: 'Receita', Categoria: 'Test', Status: '✔️' })

      // -100 + 200 + 150 = 250
      expect(store.saldoFinal).toBe(250)
    })
  })

  describe('Month Visibility', () => {
    it('should toggle month visibility', () => {
      const store = useFinanceStore()

      store.toggleMonthVisibility('2024-01')

      expect(store.isMonthHidden('2024-01')).toBe(true)

      store.toggleMonthVisibility('2024-01')

      expect(store.isMonthHidden('2024-01')).toBe(false)
    })

    it('should show all months', () => {
      const store = useFinanceStore()
      store.hideMonth('2024-01')
      store.hideMonth('2024-02')

      store.showAllMonths()

      expect(store.getHiddenMonthsCount()).toBe(0)
    })
  })

  describe('Data Persistence', () => {
    it('should save to localStorage on record addition', () => {
      const store = useFinanceStore()

      store.addRecord(mockRecord)

      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'financeData',
        expect.any(String)
      )
    })

    it('should clear all data', () => {
      const store = useFinanceStore()
      store.addRecord(mockRecord)

      store.clearAllData()

      expect(store.records).toHaveLength(0)
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('financeData')
    })
  })
}) 