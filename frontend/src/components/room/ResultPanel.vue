<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import PlayerList from '@/components/PlayerList.vue'

const props = defineProps({ state: { type: Object, required: true } })

const SCRAP_COLORS = ['#e03340', '#17151c', '#b9b2a6', '#d9a441']

const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()

const youWon = computed(() => props.state.winner?.id === props.state.you.id)

const standings = computed(() =>
  [...props.state.players].sort(
    (a, b) => Number(b.alive) - Number(a.alive) || b.kills - a.kills || a.name.localeCompare(b.name),
  ),
)

/** Torn-paper confetti for the winner — on-palette scraps, not casino glitter. */
const scraps = ref([])
let confettiTimer

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!youWon.value || reduced) {
    if (youWon.value) navigator.vibrate?.([40, 60, 40, 60, 120])
    return
  }
  navigator.vibrate?.([40, 60, 40, 60, 120])
  scraps.value = Array.from({ length: 36 }, (_, i) => ({
    left: `${(i * 137) % 100}%`,
    color: SCRAP_COLORS[i % SCRAP_COLORS.length],
    dur: `${2.6 + (i % 5) * 0.5}s`,
    delay: `${(i % 9) * 0.18}s`,
    rot: `${180 + (i % 7) * 120}deg`,
    drift: `${((i % 5) - 2) * 30}px`,
  }))
  confettiTimer = window.setTimeout(() => (scraps.value = []), 5200)
})

onBeforeUnmount(() => window.clearTimeout(confettiTimer))

function leave() {
  roomStore.reset()
  sessionStore.clear()
  router.push('/')
}
</script>

<template>
  <div class="result">
    <div v-if="scraps.length" class="confetti" aria-hidden="true">
      <span
        v-for="(s, i) in scraps"
        :key="i"
        class="scrap"
        :style="{
          left: s.left,
          background: s.color,
          '--dur': s.dur,
          '--delay': s.delay,
          '--rot': s.rot,
          '--drift': s.drift,
        }"
      ></span>
    </div>

    <div class="head">
      <p class="dateline mono">
        Final edition · Room {{ state.code }} · {{ state.players.length }} players
      </p>

      <template v-if="youWon">
        <h2 class="headline serif">
          <span class="line"><span class="line-in" :style="{ '--i': 0 }">Last one</span></span>
          <span class="line"><span class="line-in" :style="{ '--i': 1 }">standing<span class="dot">.</span></span></span>
        </h2>
        <p class="hint">
          You outlived {{ state.players.length - 1 }} other
          {{ state.players.length - 1 === 1 ? 'player' : 'players' }}. Sleep with one eye open.
        </p>
      </template>

      <template v-else>
        <p class="eyebrow">Game over</p>
        <h2 class="headline headline-sm serif">
          <span class="line">
            <span class="line-in" :style="{ '--i': 0 }">
              <span class="u">{{ state.winner?.name ?? 'Nobody' }}</span><span class="dot">.</span>
            </span>
          </span>
        </h2>
        <p class="hint">…is the last one standing.</p>
      </template>
    </div>

    <section class="card">
      <span class="field-label">Final standings</span>
      <PlayerList :players="standings" :you-id="state.you.id" show-status />
    </section>

    <button class="btn btn-primary btn-block" type="button" @click="leave">Back to home</button>
  </div>
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.confetti {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  overflow: hidden;
}

.scrap {
  position: absolute;
  top: -24px;
  width: 8px;
  height: 14px;
  border-radius: 1px;
  opacity: 0;
  animation: scrap-fall var(--dur) linear var(--delay) forwards;
}

@keyframes scrap-fall {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    opacity: 0.85;
    transform: translate3d(var(--drift), 108vh, 0) rotate(var(--rot));
  }
}

.head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding-top: 12px;
}

.dateline {
  width: 100%;
  padding: 7px 0;
  border-top: 1px solid var(--ink);
  border-bottom: 1px solid var(--border-strong);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.headline {
  font-size: 52px;
  font-weight: 650;
  font-style: italic;
  line-height: 1.02;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.headline-sm {
  font-size: 40px;
}

.dot {
  color: var(--accent);
}

/* broadsheet reveal: each line rises out of an invisible mask */
.line {
  display: block;
  overflow: hidden;
  padding: 0 0.06em 0.08em; /* keep italic overhang inside the mask */
}

.line-in {
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  .line-in {
    animation: mask-rise 0.7s var(--ease-out) both;
    animation-delay: calc(var(--i) * 130ms + 0.15s);
  }
}

@keyframes mask-rise {
  from {
    transform: translateY(112%);
  }
}

/* loser view: a red rule draws itself under the winner's name */
.u {
  position: relative;
}

.u::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.02em;
  height: 3px;
  background: var(--accent);
  transform-origin: left;
}

@media (prefers-reduced-motion: no-preference) {
  .u::after {
    animation: draw-x 0.6s var(--ease-out) 0.7s both;
  }
}

@keyframes draw-x {
  from {
    transform: scaleX(0);
  }
}

.card .field-label {
  display: block;
  margin-bottom: 6px;
}
</style>
