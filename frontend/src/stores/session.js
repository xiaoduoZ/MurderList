import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * The player's credentials for the current room ({ code, playerId, token, name }),
 * persisted to localStorage so a reload or phone lock doesn't drop the game.
 */

const STORAGE_KEY = 'murderlist.session'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.code && parsed.playerId && parsed.token) return parsed
  } catch {
    /* corrupted storage — start fresh */
  }
  return null
}

export const useSessionStore = defineStore('session', () => {
  const session = ref(load())

  function save(next) {
    session.value = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function clear() {
    session.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return { session, save, clear }
})
