import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Reusable scene/weapon lists the host can prepare ahead of time and load
 * again next time, so they don't have to retype everything before a game.
 * Persisted to localStorage — survives reloads and days.
 *
 * A preset is { id, name, scenes: string[], items: string[], updatedAt }.
 */

const STORAGE_KEY = 'murderlist.presets'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) => p && typeof p.name === 'string' && Array.isArray(p.scenes) && Array.isArray(p.items),
      )
    }
  } catch {
    /* corrupted storage — start fresh */
  }
  return []
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export const usePresetsStore = defineStore('presets', () => {
  const presets = ref(load())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value))
  }

  /** Create or overwrite a list (matched case-insensitively by name). */
  function save(name, scenes, items) {
    const trimmed = name.trim().slice(0, 40)
    if (!trimmed) return
    const entry = {
      id: newId(),
      name: trimmed,
      scenes: [...scenes],
      items: [...items],
      updatedAt: Date.now(),
    }
    const idx = presets.value.findIndex((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    if (idx >= 0) {
      entry.id = presets.value[idx].id
      presets.value = presets.value.map((p, i) => (i === idx ? entry : p))
    } else {
      presets.value = [entry, ...presets.value]
    }
    persist()
  }

  function remove(id) {
    presets.value = presets.value.filter((p) => p.id !== id)
    persist()
  }

  return { presets, save, remove }
})
