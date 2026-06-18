<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import { toast } from '@/composables/toast'
import LogoMark from '@/components/LogoMark.vue'
import LobbyPanel from '@/components/room/LobbyPanel.vue'
import MissionPanel from '@/components/room/MissionPanel.vue'
import DeadPanel from '@/components/room/DeadPanel.vue'
import ResultPanel from '@/components/room/ResultPanel.vue'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()

const code = String(route.params.code ?? '').toUpperCase()
const hasSession = sessionStore.session?.code === code

const state = computed(() => roomStore.state)

const gamePanel = computed(() => {
  const s = state.value
  if (!s) return 'loading'
  if (s.status === 'lobby') return 'lobby'
  if (s.status === 'finished') return 'result'
  return s.you.alive ? 'mission' : 'dead'
})

/**
 * 3-2-1 countdown shown the moment the game starts. Polling keeps every
 * phone within a couple of seconds, so the whole party counts down together.
 */
const countdown = ref(0)
let countdownTimer

/** Crimson hard-cut overlay when you get eliminated. */
const deathFlash = ref(false)
let flashTimer

const panel = computed(() => (countdown.value > 0 ? 'countdown' : gamePanel.value))

watch(gamePanel, (next, prev) => {
  if (prev === 'lobby' && (next === 'mission' || next === 'dead')) runCountdown()
  if (prev === 'mission' && next === 'dead') {
    deathFlash.value = true
    window.clearTimeout(flashTimer)
    flashTimer = window.setTimeout(() => (deathFlash.value = false), 750)
  }
})

function runCountdown() {
  window.clearInterval(countdownTimer) // never orphan a previous interval
  countdown.value = 3
  navigator.vibrate?.(20)
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer)
      navigator.vibrate?.(90)
    } else {
      navigator.vibrate?.(20)
    }
  }, 800)
}

function onVisible() {
  if (document.visibilityState === 'visible') roomStore.refresh()
}

onMounted(() => {
  if (!hasSession) {
    router.replace({ path: '/join', query: code ? { code } : undefined })
    return
  }
  roomStore.startPolling()
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  roomStore.stopPolling()
  window.clearInterval(countdownTimer)
  window.clearTimeout(flashTimer)
  document.removeEventListener('visibilitychange', onVisible)
})

watch(
  () => roomStore.fatalError,
  (message) => {
    if (!message) return
    toast(message)
    roomStore.reset()
    sessionStore.clear()
    router.replace('/')
  },
)
</script>

<template>
  <main v-if="hasSession" class="room">
    <header class="topbar">
      <RouterLink to="/" class="brand wordmark">
        <LogoMark :size="20" />
        <span>MURDERLIST<span class="dot">.</span></span>
      </RouterLink>
      <span class="code-chip mono">{{ code }}</span>
    </header>

    <Transition name="panel" mode="out-in">
      <div v-if="panel === 'countdown'" key="countdown" class="countdown">
        <p class="eyebrow">The hunt begins in</p>
        <Transition name="count" mode="out-in">
          <span :key="countdown" class="digit serif">{{ countdown }}</span>
        </Transition>
        <p class="hint mono blink">Missions are being dealt</p>
      </div>
      <div v-else-if="panel === 'loading'" key="loading" class="loading">
        <LogoMark :size="44" class="spin" />
        <p class="mono blink">Connecting…</p>
      </div>
      <LobbyPanel v-else-if="panel === 'lobby'" key="lobby" :state="state" />
      <MissionPanel v-else-if="panel === 'mission'" key="mission" :state="state" />
      <DeadPanel v-else-if="panel === 'dead'" key="dead" :state="state" />
      <ResultPanel v-else key="result" :state="state" />
    </Transition>

    <div v-if="deathFlash" class="death-flash" aria-hidden="true"></div>
  </main>
</template>

<style scoped>
.room {
  gap: 4px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex: 0 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.code-chip {
  padding: 5px 11px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
}

.countdown {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 55vh;
  text-align: center;
}

.digit {
  display: block;
  min-width: 1.2em;
  font-size: 120px;
  font-weight: 650;
  line-height: 1;
  color: var(--ink);
}

.count-enter-active,
.count-leave-active {
  transition: transform 0.3s var(--ease-out), opacity 0.3s var(--ease-out);
}

.count-enter-from {
  transform: scale(1.5);
  opacity: 0;
}

.count-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

.loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 50vh;
}

.spin {
  animation: spin 2.4s linear infinite;
}

.blink {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-dim);
  animation: blink 1.6s ease-in-out infinite;
}

.death-flash {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: var(--accent);
  pointer-events: none;
  opacity: 0;
  animation: hard-cut 0.7s ease-out both;
}

@keyframes hard-cut {
  0% { opacity: 0; }
  12% { opacity: 0.9; }
  100% { opacity: 0; }
}
</style>
