import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/api'
import { useSessionStore } from './session'

const POLL_MS = 2500

export const useRoomStore = defineStore('room', () => {
  const sessionStore = useSessionStore()

  const state = ref(null)
  /** Set when the session can no longer be used (room gone / token invalid). */
  const fatalError = ref(null)
  /** Briefly true right after the player's mission changes. */
  const newTarget = ref(false)

  let pollTimer
  let flashTimer
  /** undefined = no baseline yet (suppresses the flash on first load). */
  let lastTargetId
  /** Monotonic counter so late responses from older requests are discarded. */
  let refreshSeq = 0

  const alivePlayers = computed(() => state.value?.players.filter((p) => p.alive) ?? [])

  async function refresh() {
    const creds = sessionStore.session
    if (!creds) return
    const seq = ++refreshSeq
    try {
      const next = await api.getState(creds)
      // a newer refresh finished first, or the room changed — drop this response
      if (seq !== refreshSeq || sessionStore.session?.code !== creds.code) return
      const targetId = next.mission?.targetId ?? null
      if (lastTargetId !== undefined && targetId && targetId !== lastTargetId) {
        newTarget.value = true
        window.clearTimeout(flashTimer)
        flashTimer = window.setTimeout(() => (newTarget.value = false), 5000)
        navigator.vibrate?.([60, 40, 60])
      }
      lastTargetId = targetId
      state.value = next
    } catch (e) {
      if (seq !== refreshSeq || sessionStore.session?.code !== creds.code) return
      if (e instanceof ApiError && (e.code === 'ROOM_NOT_FOUND' || e.code === 'UNAUTHORIZED')) {
        fatalError.value = e.message
        stopPolling()
      }
      // Anything else (network blip, 5xx) keeps the last state; next poll retries.
    }
  }

  function startPolling() {
    stopPolling()
    // drop any snapshot retained from a previous visit to this (or another)
    // room — stale data would flash an outdated panel and could replay the
    // game-start countdown long after the real start
    state.value = null
    fatalError.value = null
    lastTargetId = undefined
    refresh()
    pollTimer = window.setInterval(refresh, POLL_MS)
  }

  function stopPolling() {
    refreshSeq++ // invalidate any in-flight refresh
    window.clearInterval(pollTimer)
    pollTimer = undefined
  }

  function reset() {
    stopPolling()
    window.clearTimeout(flashTimer)
    state.value = null
    fatalError.value = null
    newTarget.value = false
    lastTargetId = undefined
  }

  async function startGame() {
    const creds = sessionStore.session
    if (!creds) return
    await api.startGame(creds)
    await refresh()
  }

  async function reportEliminated() {
    const creds = sessionStore.session
    if (!creds) return
    await api.reportEliminated(creds)
    await refresh()
  }

  return {
    state,
    fatalError,
    newTarget,
    alivePlayers,
    refresh,
    startPolling,
    stopPolling,
    reset,
    startGame,
    reportEliminated,
  }
})
