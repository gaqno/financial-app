import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceStore } from '../../stores/financeStore'
import type { IFinanceRecord } from '../../types/finance'

// Mock window and localStorage for Node.js environment
Object.defineProperty(globalThis, 'window', {
  value: {
    location: { hostname: 'localhost' }
  },
  writable: true
})

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

describe('Auto Correction After Edit', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should remove recurring records beyond new end date', () => {
    const store = useFinanceStore()

    // Criar registros recorrentes com recurrenceId
    const recurrenceId = 'test_rec_123'
    const baseRecord: IFinanceRecord = {
      Data: '2024-01-01',
      Descrição: 'Aluguel',
      Valor: -1200,
      Tipo: 'Despesa',
      Categoria: 'Moradia',
      Status: '❌',
      Saldo: 0,
      recurrence: {
        frequency: 'mensal',
        endDate: '2024-06-01',
        isActive: true,
        recurrenceId,
        originalDate: '2024-01-01',
        instanceNumber: 1
      }
    }

    // Adicionar múltiplos registros recorrentes
    const records = [
      { ...baseRecord, Data: '2024-01-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 1 } },
      { ...baseRecord, Data: '2024-02-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 2 } },
      { ...baseRecord, Data: '2024-03-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 3 } },
      { ...baseRecord, Data: '2024-04-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 4 } },
      { ...baseRecord, Data: '2024-05-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 5 } },
      { ...baseRecord, Data: '2024-06-01', recurrence: { ...baseRecord.recurrence!, instanceNumber: 6 } }
    ]

    records.forEach(record => store.records.push(record))
    expect(store.records.length).toBe(6)

    // Criar registro atualizado com nova data limite
    const updatedRecord: IFinanceRecord = {
      ...baseRecord,
      recurrence: {
        ...baseRecord.recurrence!,
        endDate: '2024-03-01' // Nova data limite - deve remover abril, maio e junho
      }
    }

    // Executar correção automática
    store.correctFutureRecordsAfterEdit(baseRecord, updatedRecord)

    // Verificar se registros além da nova data limite foram removidos
    expect(store.records.length).toBe(3) // Janeiro, Fevereiro, Março

    const remainingDates = store.records.map(r => r.Data).sort()
    expect(remainingDates).toEqual(['2024-01-01', '2024-02-01', '2024-03-01'])
  })

  it('should correct inconsistent recurring record properties', () => {
    const store = useFinanceStore()

    const recurrenceId = 'test_rec_456'
    const originalRecord: IFinanceRecord = {
      Data: '2024-01-01',
      Descrição: 'Aluguel',
      Valor: -1200,
      Tipo: 'Despesa',
      Categoria: 'Moradia',
      Status: '❌',
      Saldo: 0,
      recurrence: {
        frequency: 'mensal',
        endDate: '2024-03-01',
        isActive: true,
        recurrenceId,
        originalDate: '2024-01-01',
        instanceNumber: 1
      }
    }

    // Adicionar registros com propriedades inconsistentes
    const records = [
      { ...originalRecord, Data: '2024-01-01' },
      { ...originalRecord, Data: '2024-02-01', Valor: -1000, Categoria: 'Despesas', recurrence: { ...originalRecord.recurrence!, instanceNumber: 2 } }, // Inconsistente
      { ...originalRecord, Data: '2024-03-01', Tipo: 'Receita' as const, recurrence: { ...originalRecord.recurrence!, instanceNumber: 3 } } // Inconsistente
    ]

    records.forEach(record => store.records.push(record))

    // Registro atualizado com valores corretos
    const updatedRecord: IFinanceRecord = {
      ...originalRecord,
      Valor: -1300,
      Categoria: 'Habitação',
      Tipo: 'Despesa'
    }

    // Executar correção automática
    store.correctFutureRecordsAfterEdit(originalRecord, updatedRecord)

    // Verificar se todos os registros foram corrigidos
    store.records.forEach(record => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        expect(record.Valor).toBe(-1300)
        expect(record.Categoria).toBe('Habitação')
        expect(record.Tipo).toBe('Despesa')
      }
    })
  })

  it('should handle records without recurrence gracefully', () => {
    const store = useFinanceStore()

    const regularRecord: IFinanceRecord = {
      Data: '2024-01-01',
      Descrição: 'Compra única',
      Valor: -100,
      Tipo: 'Despesa',
      Categoria: 'Compras',
      Status: '✔️',
      Saldo: 0
    }

    store.records.push(regularRecord)

    const updatedRecord = { ...regularRecord, Valor: -150 }

    // Não deve gerar erro ao processar record sem recorrência
    expect(() => {
      store.correctFutureRecordsAfterEdit(regularRecord, updatedRecord)
    }).not.toThrow()

    expect(store.records.length).toBe(1)
  })

  it('should remove records beyond date when end date is reduced', () => {
    const store = useFinanceStore()

    const recurrenceId = 'test_rec_789'

    // Simular chamada direta da função de remoção
    const baseRecord: IFinanceRecord = {
      Data: '2024-01-01',
      Descrição: 'Teste',
      Valor: -100,
      Tipo: 'Despesa',
      Categoria: 'Teste',
      Status: '❌',
      Saldo: 0,
      recurrence: {
        frequency: 'mensal',
        endDate: '2024-05-01',
        isActive: true,
        recurrenceId,
        originalDate: '2024-01-01',
        instanceNumber: 1
      }
    }

    // Adicionar registros até maio
    const dates = ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01']
    dates.forEach((date, index) => {
      store.records.push({
        ...baseRecord,
        Data: date,
        recurrence: { ...baseRecord.recurrence!, instanceNumber: index + 1 }
      })
    })

    expect(store.records.length).toBe(5)

    // Remover registros além de março
    const removed = store.removeRecurringRecordsBeyondDate(recurrenceId, '2024-03-01')

    expect(removed).toBe(2) // Abril e maio removidos
    expect(store.records.length).toBe(3) // Janeiro, fevereiro, março permanecem
  })

  it('should validate and correct recurring records consistently', () => {
    const store = useFinanceStore()

    const recurrenceId = 'test_rec_validation'
    const referenceRecord: IFinanceRecord = {
      Data: '2024-01-01',
      Descrição: 'Salário',
      Valor: 5000,
      Tipo: 'Receita',
      Categoria: 'Renda',
      Status: '✔️',
      Saldo: 0,
      recurrence: {
        frequency: 'mensal',
        endDate: '2024-12-01',
        isActive: true,
        recurrenceId,
        originalDate: '2024-01-01',
        instanceNumber: 1
      }
    }

    // Adicionar registros com valores inconsistentes
    const inconsistentRecords = [
      { ...referenceRecord, Data: '2024-01-01' },
      { ...referenceRecord, Data: '2024-02-01', Valor: 4500, recurrence: { ...referenceRecord.recurrence!, instanceNumber: 2 } },
      { ...referenceRecord, Data: '2024-03-01', Categoria: 'Trabalho', recurrence: { ...referenceRecord.recurrence!, instanceNumber: 3 } }
    ]

    inconsistentRecords.forEach(record => store.records.push(record))

    const corrected = store.validateAndCorrectRecurringRecords(recurrenceId, referenceRecord)

    expect(corrected).toBe(2) // Dois registros corrigidos

    // Verificar se todos estão consistentes
    store.records.forEach(record => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        expect(record.Valor).toBe(5000)
        expect(record.Categoria).toBe('Renda')
        expect(record.Tipo).toBe('Receita')
      }
    })
  })
}) 