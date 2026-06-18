<script setup>
import { computed, onMounted } from 'vue'
import PlayerList from '@/components/PlayerList.vue'

const props = defineProps({ state: { type: Object, required: true } })

const aliveCount = computed(() => props.state.players.filter((p) => p.alive).length)
const kills = computed(() => props.state.you.kills)

onMounted(() => navigator.vibrate?.([60, 40, 120]))
</script>

<template>
  <div class="dead">
    <div class="dead-head stagger">
      <span class="xstamp" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path class="x1" d="M16 16 32 32" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" />
          <path class="x2" d="M32 16 16 32" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round" />
        </svg>
      </span>
      <span class="stamp">Deceased</span>
      <h2 class="headline serif">You're out<span class="dot">.</span></h2>
      <p class="hint">
        <template v-if="kills > 0">
          You took {{ kills }} {{ kills === 1 ? 'player' : 'players' }} down with you.
        </template>
        <template v-else>The circle goes on without you.</template>
        Stick around to see who survives.
      </p>
    </div>

    <section class="card">
      <div class="head">
        <span class="field-label">The hunt continues</span>
        <span class="field-label count">
          <span class="odo"><Transition name="roll"><span :key="aliveCount">{{ aliveCount }}</span></Transition></span>
          &nbsp;alive
        </span>
      </div>
      <PlayerList :players="state.players" :you-id="state.you.id" show-status />
    </section>
  </div>
</template>

<style scoped>
.dead {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.dead-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 18px 0 4px;
}

/* the stamp slams down, slightly crooked, like ink on paper */
.xstamp {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 2.5px solid var(--accent);
  border-radius: 50%;
  position: relative;
  transform: rotate(-4deg);
}

.xstamp svg {
  width: 40px;
  height: 40px;
}

@media (prefers-reduced-motion: no-preference) {
  .xstamp {
    animation: stamp-in 0.5s var(--ease-snap) 0.1s both;
  }

  .xstamp::after {
    content: '';
    position: absolute;
    inset: -3px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    opacity: 0;
    animation: ring-out 0.7s var(--ease-out) 0.5s;
  }

  .x1,
  .x2 {
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    animation: draw-stroke 0.3s var(--ease-out) forwards;
  }

  .x1 { animation-delay: 0.45s; }
  .x2 { animation-delay: 0.6s; }
}

@keyframes stamp-in {
  from {
    opacity: 0;
    transform: scale(2.3) rotate(-14deg);
  }
  60% {
    opacity: 1;
    transform: scale(0.94) rotate(1deg);
  }
  to {
    transform: scale(1) rotate(-4deg);
  }
}

@keyframes ring-out {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@keyframes draw-stroke {
  to {
    stroke-dashoffset: 0;
  }
}

.headline {
  font-size: 36px;
  font-weight: 650;
  font-style: italic;
}

.dot {
  color: var(--accent);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.count {
  display: inline-flex;
  align-items: baseline;
  color: var(--accent-deep);
}
</style>
