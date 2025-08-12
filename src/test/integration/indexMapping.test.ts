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

describe('Index Mapping Fix Test', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should correctly delete record using property matching instead of index', () => {
    const store = useFinanceStore()
    setupTestProjection(store) // Configurar projeção para incluir dados de teste

    // Add records that will be in different order when grouped vs when stored
    const records: IFinanceRecord[] = [
      {
        Data: '2025-02-15',  // This will be in February group, but added first
        Descrição: 'February Record',
        Valor: -100,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Test'
      },
      {
        Data: '2025-01-10',  // This will be in January group, but added second
        Descrição: 'January Record 1',
        Valor: -200,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Test'
      },
      {
        Data: '2025-01-20',  // This will be in January group, but added third
        Descrição: 'January Record 2',
        Valor: -150,
        Tipo: 'Despesa',
        Status: '❌',
        Categoria: 'Test'
      }
    ]

    records.forEach(record => store.addRecord(record))
    expect(store.records).toHaveLength(3)

    // Debug: Check actual storage order
    console.log('Storage order:', store.records.map(r => r.Descrição))

    // The storage order is: Feb, Jan1, Jan2 (indices 0, 1, 2)
    // But grouped by month: Jan1, Jan2, Feb
    const grouped = store.groupedByMonth
    const januaryRecords = grouped['2025-01']

    expect(januaryRecords).toHaveLength(2)

    // Let's try to delete the second January record (Jan2)
    // In the January group, it's at index 1
    const recordToDelete = januaryRecords[1] // This should be "January Record 2"
    console.log('Record to delete:', recordToDelete.Descrição)

    // Simulate the new approach: find by properties instead of using wrong index
    const actualIndex = store.records.findIndex(r =>
      r.Data === recordToDelete.Data &&
      r.Descrição === recordToDelete.Descrição &&
      r.Valor === recordToDelete.Valor &&
      r.Tipo === recordToDelete.Tipo &&
      r.Status === recordToDelete.Status
    )

    console.log('Found at actual index:', actualIndex)
    console.log('Record at that index:', store.records[actualIndex]?.Descrição)

    expect(actualIndex).toBeGreaterThan(-1) // Should find the record
    expect(store.records[actualIndex].Descrição).toBe(recordToDelete.Descrição)

    // Delete using the correct index
    store.confirmDelete(recordToDelete, actualIndex)
    const deleteResult = store.executeDelete()

    expect(deleteResult).toBe(true)
    expect(store.records).toHaveLength(2)

    // Verify the correct record was deleted
    const remainingDescriptions = store.records.map(r => r.Descrição)
    expect(remainingDescriptions).not.toContain(recordToDelete.Descrição)
  })

  it('should handle the case where wrong index would delete wrong record', () => {
    const store = useFinanceStore()
    setupTestProjection(store) // Configurar projeção para incluir dados de teste

    // Add two records with specific order in storage
    store.addRecord({
      Data: '2025-01-31',
      Descrição: 'Last January',
      Valor: -100,
      Tipo: 'Despesa',
      Categoria: 'Test',
      Status: '❌'
    })

    store.addRecord({
      Data: '2025-01-01',
      Descrição: 'First January',
      Valor: -200,
      Tipo: 'Despesa',
      Categoria: 'Test',
      Status: '❌'
    })

    console.log('Storage order:', store.records.map(r => r.Descrição))
    console.log('Sort field:', store.sortField, 'Sort direction:', store.sortDirection)

    const sortedData = store.sortedData
    console.log('Sorted order:', sortedData.map(r => r.Descrição))

    expect(sortedData).toHaveLength(2)

    // Take the first record in sorted order
    const recordToDelete = sortedData[0]
    console.log('First sorted record:', recordToDelete.Descrição)

    // Using property matching (the fix)
    const correctIndex = store.records.findIndex(r =>
      r.Data === recordToDelete.Data &&
      r.Descrição === recordToDelete.Descrição
    )

    console.log('Found at storage index:', correctIndex)
    expect(correctIndex).toBeGreaterThan(-1) // Should find the record

    // Delete and verify
    store.confirmDelete(recordToDelete, correctIndex)
    store.executeDelete()

    expect(store.records).toHaveLength(1)

    // Verify the correct record was deleted (the other one should remain)
    const remainingRecord = store.records[0]
    expect(remainingRecord.Descrição).not.toBe(recordToDelete.Descrição)
  })
}) 