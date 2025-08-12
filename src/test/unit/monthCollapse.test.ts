import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceTableHelpers } from '../../composables/finance/useFinanceTableHelpers'

// Mock localStorage globally for this test file
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

describe('Month Collapse Functionality - Unit Tests', () => {
  let helpers: ReturnType<typeof useFinanceTableHelpers>

  beforeEach(() => {
    // Initialize Pinia before using the composable
    setActivePinia(createPinia())

    // Clear localStorage mocks
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()

    helpers = useFinanceTableHelpers()
  })

  describe('handleMonthToggle', () => {
    it('should add month to collapsed set when isCollapsed is true', () => {
      const monthKey = '2025-01'

      helpers.handleMonthToggle(monthKey, true)

      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)
    })

    it('should remove month from collapsed set when isCollapsed is false', () => {
      const monthKey = '2025-01'

      // First add it
      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      // Then remove it
      helpers.handleMonthToggle(monthKey, false)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)
    })

    it('should handle multiple months independently', () => {
      const month1 = '2025-01'
      const month2 = '2025-02'
      const month3 = '2025-03'

      // Collapse month1 and month3
      helpers.handleMonthToggle(month1, true)
      helpers.handleMonthToggle(month3, true)

      expect(helpers.collapsedMonths.value.has(month1)).toBe(true)
      expect(helpers.collapsedMonths.value.has(month2)).toBe(false)
      expect(helpers.collapsedMonths.value.has(month3)).toBe(true)

      // Expand month1, keep month3 collapsed
      helpers.handleMonthToggle(month1, false)

      expect(helpers.collapsedMonths.value.has(month1)).toBe(false)
      expect(helpers.collapsedMonths.value.has(month2)).toBe(false)
      expect(helpers.collapsedMonths.value.has(month3)).toBe(true)
    })

    it('should handle same month toggled multiple times', () => {
      const monthKey = '2025-01'

      // Toggle multiple times
      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      helpers.handleMonthToggle(monthKey, false)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)

      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      helpers.handleMonthToggle(monthKey, false)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)
    })

    it('should handle edge case with invalid month keys', () => {
      const invalidKeys = ['', 'invalid', '2025', '2025-13', 'not-a-month']

      invalidKeys.forEach(key => {
        expect(() => {
          helpers.handleMonthToggle(key, true)
          helpers.handleMonthToggle(key, false)
        }).not.toThrow()
      })
    })

    it('should maintain state consistency', () => {
      const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05']

      // Collapse odd months
      months.forEach((month, index) => {
        if (index % 2 === 0) {
          helpers.handleMonthToggle(month, true)
        }
      })

      // Verify state
      expect(helpers.collapsedMonths.value.size).toBe(3)
      expect(helpers.collapsedMonths.value.has('2025-01')).toBe(true)
      expect(helpers.collapsedMonths.value.has('2025-02')).toBe(false)
      expect(helpers.collapsedMonths.value.has('2025-03')).toBe(true)
      expect(helpers.collapsedMonths.value.has('2025-04')).toBe(false)
      expect(helpers.collapsedMonths.value.has('2025-05')).toBe(true)
    })
  })

  describe('collapsedMonths state', () => {
    it('should start with empty set', () => {
      expect(helpers.collapsedMonths.value.size).toBe(0)
    })

    it('should be reactive', () => {
      const monthKey = '2025-01'
      let changeCount = 0

      // Watch for changes (simulate component reactivity)
      const unwatch = helpers.collapsedMonths.value

      helpers.handleMonthToggle(monthKey, true)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      helpers.handleMonthToggle(monthKey, false)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)
    })

    it('should allow direct set operations', () => {
      const monthKey = '2025-01'

      // Direct set operations should work
      helpers.collapsedMonths.value.add(monthKey)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(true)

      helpers.collapsedMonths.value.delete(monthKey)
      expect(helpers.collapsedMonths.value.has(monthKey)).toBe(false)
    })
  })

  describe('integration with other helpers', () => {
    it('should not interfere with other helper functions', () => {
      const monthKey = '2025-01'

      // Collapse should not affect other functions
      helpers.handleMonthToggle(monthKey, true)

      // Other helper functions should still work
      expect(typeof helpers.getMonthStartIndex).toBe('function')
      expect(typeof helpers.handleToggleStatus).toBe('function')
      expect(typeof helpers.formatDate).toBe('function')
      expect(helpers.getMonthStartIndex('2025-01')).toBe(0)
    })
  })
}) 