import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceStore } from '../../stores/financeStore'
import type { IFinanceRecord } from '../../types/finance'

// Mock localStorage globally for this test file
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock window.confirm
vi.stubGlobal('confirm', vi.fn())

describe('Recurring Records Batch Update Integration Tests', () => {
  let financeStore: ReturnType<typeof useFinanceStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    financeStore = useFinanceStore()

    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()

    // Clear confirm mock
    vi.mocked(confirm).mockClear()
  })

  describe('updateAllLinkedRecurringRecords', () => {
    it('should update all records with the same recurrenceId', () => {
      const recurrenceId = 'salary-2025-recurring'

      // Create test records with same recurrenceId
      const salaryJune: IFinanceRecord = {
        Data: '2025-06-05',
        Descrição: 'Salário Junho',
        Valor: 5000,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Renda',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-06-05',
          instanceNumber: 1
        }
      }

      const salaryJuly: IFinanceRecord = {
        Data: '2025-07-05',
        Descrição: 'Salário Julho',
        Valor: 5000,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Renda',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-06-05',
          instanceNumber: 2
        }
      }

      const salaryAugust: IFinanceRecord = {
        Data: '2025-08-05',
        Descrição: 'Salário Agosto',
        Valor: 5000,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Renda',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-06-05',
          instanceNumber: 3
        }
      }

      // Add non-recurring record
      const nonRecurring: IFinanceRecord = {
        Data: '2025-06-10',
        Descrição: 'Compra Única',
        Valor: -100,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Compras'
      }

      // Add all records to store
      financeStore.addRecord(salaryJune)
      financeStore.addRecord(salaryJuly)
      financeStore.addRecord(salaryAugust)
      financeStore.addRecord(nonRecurring)

      expect(financeStore.records.length).toBe(4)

      // Test batch update
      const updateFields = {
        Descrição: 'Salário Atualizado',
        Valor: 5500,
        Categoria: 'Salário',
        Status: '✔️' as const
      }

      const success = financeStore.updateAllLinkedRecurringRecords(salaryJune, updateFields)

      expect(success).toBe(true)

      // Verify all recurring records were updated
      const updatedRecords = financeStore.records.filter(r => r.recurrence?.recurrenceId === recurrenceId)

      expect(updatedRecords).toHaveLength(3)

      updatedRecords.forEach((record, index) => {
        expect(record.Descrição).toBe('Salário Atualizado')
        expect(record.Valor).toBe(5500)
        expect(record.Categoria).toBe('Salário')
        expect(record.Status).toBe('✔️')

        // Dates should remain unchanged
        expect(record.Data).toBe([
          '2025-06-05',
          '2025-07-05',
          '2025-08-05'
        ][index])

        // Instance numbers should remain unchanged
        expect(record.recurrence?.instanceNumber).toBe(index + 1)
      })

      // Non-recurring record should remain unchanged
      const nonRecurringRecord = financeStore.records.find(r => r.Descrição === 'Compra Única')
      expect(nonRecurringRecord?.Valor).toBe(-100)
      expect(nonRecurringRecord?.Status).toBe('❌')
    })

    it('should preserve dates and instance numbers during batch update', () => {
      const recurrenceId = 'test-recurring'

      const record1: IFinanceRecord = {
        Data: '2025-01-15',
        Descrição: 'Original Description',
        Valor: 1000,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Original',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-01-15',
          instanceNumber: 1
        }
      }

      const record2: IFinanceRecord = {
        Data: '2025-02-15',
        Descrição: 'Original Description',
        Valor: 1000,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Original',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-01-15',
          instanceNumber: 2
        }
      }

      financeStore.addRecord(record1)
      financeStore.addRecord(record2)

      const updateFields = {
        Data: '2025-06-01', // This should be ignored
        Descrição: 'Updated Description',
        Valor: 2000,
        recurrence: {
          frequency: 'quinzenal' as const,
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId,
          originalDate: '2025-01-15',
          instanceNumber: 999 // This should be ignored
        }
      }

      const success = financeStore.updateAllLinkedRecurringRecords(record1, updateFields)
      expect(success).toBe(true)

      const updatedRecords = financeStore.records.filter(r => r.recurrence?.recurrenceId === recurrenceId)

      // Dates should remain original
      expect(updatedRecords[0].Data).toBe('2025-01-15')
      expect(updatedRecords[1].Data).toBe('2025-02-15')

      // Instance numbers should remain original
      expect(updatedRecords[0].recurrence?.instanceNumber).toBe(1)
      expect(updatedRecords[1].recurrence?.instanceNumber).toBe(2)

      // Other fields should be updated
      expect(updatedRecords[0].Descrição).toBe('Updated Description')
      expect(updatedRecords[1].Descrição).toBe('Updated Description')
      expect(updatedRecords[0].Valor).toBe(2000)
      expect(updatedRecords[1].Valor).toBe(2000)

      // Recurrence frequency should be updated but instance numbers preserved
      expect(updatedRecords[0].recurrence?.frequency).toBe('quinzenal')
      expect(updatedRecords[1].recurrence?.frequency).toBe('quinzenal')
    })

    it('should return false when no recurrenceId exists', () => {
      const nonRecurringRecord: IFinanceRecord = {
        Data: '2025-06-01',
        Descrição: 'Non-recurring',
        Valor: 100,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Test'
      }

      financeStore.addRecord(nonRecurringRecord)

      const success = financeStore.updateAllLinkedRecurringRecords(nonRecurringRecord, {
        Descrição: 'Updated'
      })

      expect(success).toBe(false)
    })

    it('should return false when only one record with recurrenceId exists', () => {
      const singleRecord: IFinanceRecord = {
        Data: '2025-06-01',
        Descrição: 'Single Record',
        Valor: 100,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Test',
        recurrence: {
          frequency: 'mensal',
          endDate: '2025-12-31',
          isActive: true,
          recurrenceId: 'single-record',
          originalDate: '2025-06-01',
          instanceNumber: 1
        }
      }

      financeStore.addRecord(singleRecord)

      const success = financeStore.updateAllLinkedRecurringRecords(singleRecord, {
        Descrição: 'Updated'
      })

      expect(success).toBe(false)
    })
  })

  describe('saveEdit with recurring records', () => {
    it('should prompt user and update all linked records when user confirms', () => {
      const recurrenceId = 'monthly-salary'

      // Mock user confirmation
      vi.mocked(confirm).mockReturnValue(true)

      // Create test recurring records
      const records: IFinanceRecord[] = [
        {
          Data: '2025-06-01',
          Descrição: 'Salário Original',
          Valor: 4000,
          Tipo: 'Receita',
          Status: '❌',
          Categoria: 'Salário',
          recurrence: {
            frequency: 'mensal',
            endDate: '2025-12-31',
            isActive: true,
            recurrenceId,
            originalDate: '2025-06-01',
            instanceNumber: 1
          }
        },
        {
          Data: '2025-07-01',
          Descrição: 'Salário Original',
          Valor: 4000,
          Tipo: 'Receita',
          Status: '❌',
          Categoria: 'Salário',
          recurrence: {
            frequency: 'mensal',
            endDate: '2025-12-31',
            isActive: true,
            recurrenceId,
            originalDate: '2025-06-01',
            instanceNumber: 2
          }
        },
        {
          Data: '2025-08-01',
          Descrição: 'Salário Original',
          Valor: 4000,
          Tipo: 'Receita',
          Status: '❌',
          Categoria: 'Salário',
          recurrence: {
            frequency: 'mensal',
            endDate: '2025-12-31',
            isActive: true,
            recurrenceId,
            originalDate: '2025-06-01',
            instanceNumber: 3
          }
        }
      ]

      records.forEach(record => financeStore.addRecord(record))

      // Start editing the first record
      financeStore.startEdit(records[0], 0)

      // Modify the editing record
      financeStore.editingRecord!.Descrição = 'Salário Aumentado'
      financeStore.editingRecord!.Valor = 4500
      financeStore.editingRecord!.Categoria = 'Salário Novo'
      financeStore.editingRecord!.Status = '✔️'

      // Save the edit
      const success = financeStore.saveEdit()

      expect(success).toBe(true)

      // Verify user was prompted
      expect(confirm).toHaveBeenCalledWith(
        expect.stringContaining('Este é um registro recorrente')
      )

      // Verify all records were updated
      const allRecords = financeStore.records.filter(r => r.recurrence?.recurrenceId === recurrenceId)

      expect(allRecords).toHaveLength(3)

      allRecords.forEach(record => {
        expect(record.Descrição).toBe('Salário Aumentado')
        expect(record.Valor).toBe(4500)
        expect(record.Categoria).toBe('Salário Novo')
        expect(record.Status).toBe('✔️')
      })

      // Verify edit sheet was closed
      expect(financeStore.showEditSheet).toBe(false)
      expect(financeStore.editingRecord).toBe(null)
    })

    it('should update only single record when user declines batch update', () => {
      const recurrenceId = 'monthly-expense'

      // Mock user declining batch update
      vi.mocked(confirm).mockReturnValue(false)

      const records: IFinanceRecord[] = [
        {
          Data: '2025-06-01',
          Descrição: 'Expense Original',
          Valor: -500,
          Tipo: 'Despesa',
          Status: '❌',
          Categoria: 'Utilities',
          recurrence: {
            frequency: 'mensal',
            endDate: '2025-12-31',
            isActive: true,
            recurrenceId,
            originalDate: '2025-06-01',
            instanceNumber: 1
          }
        },
        {
          Data: '2025-07-01',
          Descrição: 'Expense Original',
          Valor: -500,
          Tipo: 'Despesa',
          Status: '❌',
          Categoria: 'Utilities',
          recurrence: {
            frequency: 'mensal',
            endDate: '2025-12-31',
            isActive: true,
            recurrenceId,
            originalDate: '2025-06-01',
            instanceNumber: 2
          }
        }
      ]

      records.forEach(record => financeStore.addRecord(record))

      // Start editing the first record
      financeStore.startEdit(records[0], 0)

      // Modify the editing record
      financeStore.editingRecord!.Descrição = 'Updated Expense'
      financeStore.editingRecord!.Valor = -600

      // Save the edit
      const success = financeStore.saveEdit()

      expect(success).toBe(true)

      // Verify user was prompted
      expect(confirm).toHaveBeenCalledWith(
        expect.stringContaining('Este é um registro recorrente')
      )

      // Verify only the first record was updated
      const firstRecord = financeStore.records.find(r => r.Data === '2025-06-01')
      const secondRecord = financeStore.records.find(r => r.Data === '2025-07-01')

      expect(firstRecord?.Descrição).toBe('Updated Expense')
      expect(firstRecord?.Valor).toBe(-600)

      expect(secondRecord?.Descrição).toBe('Expense Original')
      expect(secondRecord?.Valor).toBe(-500)
    })

    it('should work normally for non-recurring records', () => {
      const nonRecurringRecord: IFinanceRecord = {
        Data: '2025-06-01',
        Descrição: 'Single Transaction',
        Valor: 100,
        Tipo: 'Receita',
        Status: '❌',
        Categoria: 'Misc'
      }

      financeStore.addRecord(nonRecurringRecord)

      // Start editing
      financeStore.startEdit(nonRecurringRecord, 0)

      // Modify
      financeStore.editingRecord!.Descrição = 'Updated Transaction'
      financeStore.editingRecord!.Valor = 150

      // Save
      const success = financeStore.saveEdit()

      expect(success).toBe(true)

      // Verify no prompt was shown
      expect(confirm).not.toHaveBeenCalled()

      // Verify record was updated
      const updatedRecord = financeStore.records[0]
      expect(updatedRecord.Descrição).toBe('Updated Transaction')
      expect(updatedRecord.Valor).toBe(150)
    })
  })
}) 