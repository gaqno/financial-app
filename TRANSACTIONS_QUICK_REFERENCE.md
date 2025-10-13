# 🚀 TRANSACTIONS MODULE - Quick Reference Guide

> **For Developers:** Fast lookup for common tasks and patterns

---

## 📦 File Structure Quick Map

```
src/
├── components/
│   ├── PorQuinho.vue                          # Main container
│   │   └── hooks/usePorQuinhoMain.ts         # Tab navigation logic
│   │
│   └── FinanceTable/
│       ├── FinanceTable.vue                   # Transactions UI
│       └── hooks/
│           └── useFinanceTableMain.ts         # Main business logic
│
├── composables/
│   ├── useSupabaseFinance.ts                  # Database operations
│   └── finance/
│       ├── useTransactionValidation.ts        # Form validation
│       ├── useRecurrenceHelpers.ts            # Recurring records
│       ├── useBusinessDays.ts                 # Business day calc
│       └── useFinanceTableHelpers.ts          # UI helpers
│
├── stores/
│   └── financeStore.ts                        # Pinia state management
│
├── types/
│   └── finance.ts                             # TypeScript interfaces
│
└── schemas/
    └── transactionSchema.ts                   # Zod validation schemas
```

---

## ⚡ Common Tasks

### 1. Add a New Transaction (Programmatically)

```typescript
import { useFinanceStore } from '@/stores/financeStore'

const store = useFinanceStore()

await store.addRecord({
  Data: '2025-10-06',
  Descrição: 'Salário Outubro',
  Valor: 5000,
  Tipo: 'Receita',
  Categoria: 'Salário',
  Status: '✔️',
})
```

### 2. Create Recurring Transaction

```typescript
const store = useFinanceStore()

const baseRecord = {
  Data: '2025-10-01',
  Descrição: 'Aluguel',
  Valor: -1500,
  Tipo: 'Despesa',
  Categoria: 'Moradia',
  Status: '❌',
  recurrence: {
    frequency: 'mensal',
    endDate: '2026-10-01',
    isActive: true,
  }
}

// Will generate 12 monthly records
await store.addRecord(baseRecord)
```

### 3. Filter Transactions

```typescript
const store = useFinanceStore()

// Filter by type
store.setFilter('Receita')  // Only income
store.setFilter('Despesa')  // Only expenses
store.setFilter('all')      // All transactions

// Filter by category
store.setCategoryFilter('Alimentação')

// Clear category filter
store.clearCategoryFilter()
```

### 4. Sort Transactions

```typescript
const store = useFinanceStore()

// Sort by date (most recent first)
store.setSorting('Data', 'desc')

// Sort by value (ascending)
store.setSorting('Valor', 'asc')

// Sort by description (alphabetical)
store.setSorting('Descrição', 'asc')
```

### 5. Get Balance

```typescript
const store = useFinanceStore()
const { saldoFinal, saldoPendente, saldoCompleto } = storeToRefs(store)

console.log('Confirmed balance:', saldoFinal.value)
console.log('Pending expenses:', saldoPendente.value)
console.log('Total (all):', saldoCompleto.value)
```

### 6. Validate Transaction Data

```typescript
import { useTransactionValidation } from '@/composables/finance/useTransactionValidation'

const { transactionForm, validation } = useTransactionValidation()

// Set field values
transactionForm.setFieldValue('Data', '2025-10-06')
transactionForm.setFieldValue('Descrição', 'Test')
transactionForm.setFieldValue('Valor', 100)

// Check validation
if (validation.isTransactionValid.value) {
  // Submit form
  const data = await transactionForm.submit()
}
```

### 7. Calculate Business Day

```typescript
import { useBusinessDays } from '@/composables/finance/useBusinessDays'

const { calculateBusinessDay } = useBusinessDays()

// Get 5th business day of October 2025
const date = calculateBusinessDay(2025, 10, 5)
console.log(date) // '2025-10-07' (skips weekends)
```

### 8. Import from CSV

```typescript
import { useCSVImport } from '@/composables/useCSVImport'

const { importCSV } = useCSVImport()

const csvData = [
  { Data: '2025-10-01', Descrição: 'Test 1', Valor: 100, ... },
  { Data: '2025-10-02', Descrição: 'Test 2', Valor: -50, ... },
]

await store.importRecords(csvData)
```

---

## 🎯 Common Patterns

### Pattern 1: Open Create Sheet from Anywhere

```typescript
// In parent component
const financeTableRef = ref<InstanceType<typeof FinanceTable> | null>(null)

// Open create sheet
const openNewTransaction = () => {
  financeTableRef.value?.openCreateSheet()
}

// Open with pre-filled type
const openQuickIncome = async () => {
  financeTableRef.value?.openCreateSheet()
  await nextTick()
  financeTableRef.value?.setTransactionType('Receita')
}
```

### Pattern 2: Listen to CRUD Events

```typescript
// Component setup
<FinanceTable 
  @sheet-opened="handleSheetOpened"
  @sheet-closed="handleSheetClosed"
/>

const handleSheetOpened = () => {
  console.log('Sheet opened')
  // Update parent state
}

const handleSheetClosed = () => {
  console.log('Sheet closed')
  // Update parent state
}
```

### Pattern 3: Custom Validation Rule

```typescript
// In transactionSchema.ts
export const customTransactionSchema = transactionSchema.extend({
  Valor: z.number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(1000000, 'Valor muito alto')
    .refine(
      (val) => val !== 666, 
      { message: 'Valor não permitido' }
    ),
})
```

### Pattern 4: Batch Update Records

```typescript
const store = useFinanceStore()

const updates = [
  { index: 0, updates: { Status: '✔️' } },
  { index: 1, updates: { Status: '✔️' } },
  { index: 2, updates: { Categoria: 'Lazer' } },
]

await store.updateRecordsBatch(updates)
```

### Pattern 5: Access Nested Hook Values

```typescript
const { 
  // Store state
  records,
  filteredData,
  groupedByMonth,
  
  // Computed
  saldoFinal,
  
  // Actions
  handleEditRecord,
  handleDeleteRecord,
  
  // Forms
  transactionForm,
  editForm,
  validation,
  
  // Modal state
  showCreateSheet,
  isCreating,
} = useFinanceTableMain(callbacks)
```

---

## 🐛 Debugging Tips

### 1. Check Store State

```typescript
// Add to component
import { useFinanceStore } from '@/stores/financeStore'

const store = useFinanceStore()

watch(() => store.records, (newRecords) => {
  console.log('📊 [DEBUG] Store records:', newRecords.length)
  console.log('First 3:', newRecords.slice(0, 3))
}, { deep: true })
```

### 2. Monitor Form Validation

```typescript
const { transactionForm, validation } = useTransactionValidation()

watch(() => validation.isTransactionValid.value, (isValid) => {
  console.log('✓ Form valid:', isValid)
  console.log('❌ Errors:', transactionForm.errors.value)
})
```

### 3. Track Supabase Operations

```typescript
// In useSupabaseFinance.ts
const addRecord = async (record: IFinanceRecord) => {
  console.log('🔹 [SUPABASE] Adding record:', record)
  
  const result = await supabase.from('finance_records').insert(...)
  
  console.log('✅ [SUPABASE] Result:', result)
  return result
}
```

### 4. Check Recurrence Generation

```typescript
import { useRecurrenceHelpers } from '@/composables/finance/useRecurrenceHelpers'

const { generateRecurringRecordsForEdit } = useRecurrenceHelpers()

const records = generateRecurringRecordsForEdit(baseRecord, recurrenceSettings)

console.log('🔁 Generated records:', records.length)
console.log('First:', records[0])
console.log('Last:', records[records.length - 1])
```

### 5. Verify Business Day Calculation

```typescript
import { useBusinessDays } from '@/composables/finance/useBusinessDays'

const { calculateBusinessDay, isBusinessDay } = useBusinessDays()

const date = new Date('2025-10-06')
console.log('Is business day?', isBusinessDay(date))

const fifthBusinessDay = calculateBusinessDay(2025, 10, 5)
console.log('5th business day:', fifthBusinessDay)
```

---

## 🔧 Configuration

### Environment Variables

```env
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 📊 Key Computed Properties

### Store Computeds

```typescript
// Available from useFinanceStore()
const store = useFinanceStore()

store.records           // Raw records array
store.sortedData        // Sorted by user preference
store.filteredData      // Filtered by type/category
store.groupedByMonth    // Grouped by month key
store.saldoFinal        // Confirmed transactions only
store.saldoPendente     // Pending expenses
store.saldoCompleto     // All transactions
store.isLoading         // Loading state
```

### Component Computeds

```typescript
// In useFinanceTableMain()
const {
  tabs,                 // Navigation tabs
  currentActiveTab,     // Active tab ID
  currentBalance,       // Balance for active tab
  shouldShowBalance,    // Show/hide balance
  isModalOpen,          // Any modal open?
  isCreating,           // Create vs Edit mode
  currentRecord,        // Current form data
  dateFieldValue,       // Date field v-model
} = useFinanceTableMain()
```

---

## 🎨 Styling Classes

### Validation Classes

```typescript
// From useTransactionValidation()
const { validationClasses } = useTransactionValidation()

validationClasses.value.field.valid      // Green border
validationClasses.value.field.invalid    // Red border
validationClasses.value.field.neutral    // Default
validationClasses.value.error.text       // Error text color
validationClasses.value.error.background // Error bg
```

### Dark Mode Classes

```typescript
// Component classes
<div class="bg-white dark:bg-slate-900">
<input class="text-gray-900 dark:text-gray-100">
<button class="bg-blue-600 dark:bg-blue-700">
```

---

## 🚨 Common Errors & Solutions

### Error 1: "Cannot read property 'value' of undefined"

**Cause:** Accessing reactive ref without `.value`

**Solution:**
```typescript
// ❌ Wrong
const records = useFinanceStore().records
console.log(records.length)

// ✅ Correct
const { records } = storeToRefs(useFinanceStore())
console.log(records.value.length)
```

### Error 2: "Supabase: User not authenticated"

**Cause:** Trying to perform operations without auth

**Solution:**
```typescript
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

if (!user.value) {
  console.error('User not authenticated')
  return
}

// Proceed with operation
await store.addRecord(...)
```

### Error 3: "Validation failed: Descrição é obrigatória"

**Cause:** Form submitted with missing required fields

**Solution:**
```typescript
const { validation } = useTransactionValidation()

if (!validation.isTransactionValid.value) {
  console.error('Form invalid:', transactionForm.errors.value)
  return
}

// Proceed with submission
await transactionForm.submit()
```

### Error 4: "Records not updating in UI"

**Cause:** Not using reactive refs properly

**Solution:**
```typescript
// ❌ Wrong: Direct mutation
records.value[0].Status = '✔️'

// ✅ Correct: Use store action
await store.updateRecord(0, { Status: '✔️' })

// OR create new array reference
records.value = records.value.map((r, i) => 
  i === 0 ? { ...r, Status: '✔️' } : r
)
```

---

## 🎯 Best Practices Checklist

### Before Creating PR:

- [ ] All logic extracted to hooks (no logic in `.vue` files)
- [ ] Interfaces prefixed with `I`
- [ ] TypeScript strict mode passing
- [ ] Zod validation schemas defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Dark mode classes added
- [ ] Mobile responsive tested
- [ ] Supabase queries optimized
- [ ] RLS policies verified
- [ ] Console logs removed/guarded
- [ ] Toast notifications for user feedback
- [ ] Undo functionality where appropriate

---

## 📱 Mobile-Specific Features

### Floating Action Button (FAB)

```typescript
// Available actions
<FloatingActionButton
  :is-modal-open="isModalOpen"
  @quick-add-income="handleQuickAddIncome"
  @quick-add-expense="handleQuickAddExpense"
  @voice-input="handleVoiceInput"
  @scan-receipt="handleScanReceipt"
  @toggle-filters="handleToggleFilters"
/>
```

### Bottom Sheet Modal

```vue
<!-- Mobile: slides from bottom -->
<!-- Desktop: centered modal -->
<div class="
  absolute bottom-0 left-0 right-0 h-[90vh]
  lg:bottom-auto lg:left-1/2 lg:top-1/2 
  lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2
  lg:w-full lg:max-w-md lg:h-[80vh]
">
  <!-- Form content -->
</div>
```

---

## 🔗 Useful Links

- **Main Documentation**: [TRANSACTIONS_MODULE_SCENARIO.md](./TRANSACTIONS_MODULE_SCENARIO.md)
- **Pinia Store**: [financeStore.ts](./src/stores/financeStore.ts)
- **Supabase Integration**: [useSupabaseFinance.ts](./src/composables/useSupabaseFinance.ts)
- **Type Definitions**: [finance.ts](./src/types/finance.ts)

---

**Quick Reference Version:** 1.0.0  
**Last Updated:** October 6, 2025

