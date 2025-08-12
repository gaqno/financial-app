import { ref, computed, onBeforeUnmount } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import type { IFinanceRecord } from '../../types/finance'

interface IDeleteItem {
  record: IFinanceRecord
  index: number
}

interface IDeletedItem {
  record: IFinanceRecord
  index: number
  restoreData?: any
}

export function useFinanceModals() {
  const financeStore = useFinanceStore()

  // Modal state
  const showDeleteConfirm = ref<boolean>(false)
  const itemToDelete = ref<IDeleteItem | null>(null)

  // Toast state
  const showUndoToast = ref<boolean>(false)
  const deletedItem = ref<IDeletedItem | null>(null)
  const undoTimeLeft = ref<number>(0)

  // Edit sheet modal state
  const showEditSheet = ref<boolean>(false)

  // Multiple records modal state
  const showMultipleRecords = ref<boolean>(false)

  // Internal timer for undo countdown
  let undoTimer: number | null = null
  let undoCountdown: number | null = null

  // Delete confirmation modal
  const confirmDelete = (record: IFinanceRecord, index: number) => {
    itemToDelete.value = { record, index }
    showDeleteConfirm.value = true
    console.log('🗑️ [MODAL] Showing delete confirmation for:', record.Descrição)
  }

  const cancelDelete = () => {
    itemToDelete.value = null
    showDeleteConfirm.value = false
    console.log('❌ [MODAL] Cancelled delete operation')
  }

  const executeDelete = () => {
    if (!itemToDelete.value) return

    const { record, index } = itemToDelete.value

    try {
      // Store deleted item for undo functionality
      deletedItem.value = {
        record: { ...record },
        index,
        restoreData: { ...record }
      }

      // Remove the record using the store
      const success = financeStore.removeRecord(index)

      if (success) {
        console.log('✅ [MODAL] Record deleted successfully:', record.Descrição)

        // Close delete modal
        showDeleteConfirm.value = false
        itemToDelete.value = null

        // Show undo toast
        showUndoToastWithTimer()
      } else {
        console.error('❌ [MODAL] Failed to delete record')
      }

    } catch (error) {
      console.error('❌ [MODAL] Error deleting record:', error)
    }
  }

  // Undo functionality
  const showUndoToastWithTimer = () => {
    if (undoTimer) {
      clearTimeout(undoTimer)
    }
    if (undoCountdown) {
      clearInterval(undoCountdown)
    }

    undoTimeLeft.value = 5
    showUndoToast.value = true

    // Countdown timer
    undoCountdown = window.setInterval(() => {
      undoTimeLeft.value--
      if (undoTimeLeft.value <= 0) {
        hideUndoToast()
      }
    }, 1000)

    // Auto-hide timer
    undoTimer = window.setTimeout(() => {
      hideUndoToast()
    }, 5000)

    console.log('⏰ [MODAL] Undo toast shown with 5 second timer')
  }

  const undoDelete = () => {
    if (!deletedItem.value) return

    try {
      const { record, restoreData } = deletedItem.value

      // Add the record back to the data
      financeStore.addRecord(restoreData)

      console.log('↩️ [MODAL] Restored deleted record:', record.Descrição)

      // Clear undo state
      hideUndoToast()

    } catch (error) {
      console.error('❌ [MODAL] Error restoring record:', error)
    }
  }

  const hideUndoToast = () => {
    showUndoToast.value = false
    deletedItem.value = null
    undoTimeLeft.value = 0

    if (undoTimer) {
      clearTimeout(undoTimer)
      undoTimer = null
    }
    if (undoCountdown) {
      clearInterval(undoCountdown)
      undoCountdown = null
    }

    console.log('❌ [MODAL] Undo toast hidden')
  }

  // Edit sheet modal
  const openEditSheet = () => {
    showEditSheet.value = true
    console.log('✏️ [MODAL] Edit sheet opened')
  }

  const closeEditSheet = () => {
    showEditSheet.value = false
    console.log('❌ [MODAL] Edit sheet closed')
  }

  // Multiple records modal
  const openMultipleRecords = () => {
    showMultipleRecords.value = true
    console.log('📝 [MODAL] Multiple records modal opened')
  }

  const closeMultipleRecords = () => {
    showMultipleRecords.value = false
    console.log('❌ [MODAL] Multiple records modal closed')
  }

  // Computed properties
  const hasActiveModal = computed(() => {
    return showDeleteConfirm.value ||
      showEditSheet.value ||
      showMultipleRecords.value
  })

  const hasActiveToast = computed(() => {
    return showUndoToast.value
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (undoTimer) {
      clearTimeout(undoTimer)
    }
    if (undoCountdown) {
      clearInterval(undoCountdown)
    }
  })

  // ESC key handler for modals
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showDeleteConfirm.value) {
        cancelDelete()
      } else if (showEditSheet.value) {
        closeEditSheet()
      } else if (showMultipleRecords.value) {
        closeMultipleRecords()
      }
    }
  }

  // Auto-register escape key handler
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', handleEscapeKey)

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscapeKey)
    })
  }

  return {
    // Delete confirmation modal
    showDeleteConfirm,
    itemToDelete,
    confirmDelete,
    cancelDelete,
    executeDelete,

    // Undo toast
    showUndoToast,
    deletedItem,
    undoTimeLeft,
    undoDelete,
    hideUndoToast,

    // Edit sheet modal
    showEditSheet,
    openEditSheet,
    closeEditSheet,

    // Multiple records modal
    showMultipleRecords,
    openMultipleRecords,
    closeMultipleRecords,

    // Computed
    hasActiveModal,
    hasActiveToast,

    // Utilities
    handleEscapeKey
  }
} 