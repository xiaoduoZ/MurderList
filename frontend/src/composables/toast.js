import { ref } from 'vue'

const TOAST_MS = 3800

/** Module-level singleton so any component can fire a toast. */
export const toasts = ref([])
let nextId = 1

export function toast(message, kind = 'error') {
  const id = nextId++
  toasts.value.push({ id, message, kind })
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, TOAST_MS)
}

/** Convenience: surface an unknown error as a toast. */
export function toastError(e) {
  toast(e instanceof Error ? e.message : 'Something went wrong.')
}
