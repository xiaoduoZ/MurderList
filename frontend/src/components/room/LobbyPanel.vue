<script setup>
import { computed, ref } from 'vue'
import { useRoomStore } from '@/stores/room'
import { toastError } from '@/composables/toast'
import QrPanel from '@/components/QrPanel.vue'
import PlayerList from '@/components/PlayerList.vue'

const props = defineProps({ state: { type: Object, required: true } })

const roomStore = useRoomStore()
const starting = ref(false)

const isHost = computed(() => props.state.you.isHost)
const host = computed(() => props.state.players.find((p) => p.isHost))
const count = computed(() => props.state.players.length)

async function start() {
  starting.value = true
  try {
    await roomStore.startGame()
  } catch (e) {
    toastError(e)
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <div class="lobby stagger">
    <p class="eyebrow live">
      <span class="livedot" aria-hidden="true"></span>
      Lobby ·
      <span class="odo"><Transition name="roll"><span :key="count">{{ count }}</span></Transition></span>
      {{ count === 1 ? 'player' : 'players' }}
    </p>

    <QrPanel v-if="isHost" :code="state.code" />

    <section class="card">
      <div class="players-head">
        <span class="field-label">Players</span>
        <span class="field-label pool">{{ state.scenes.length }} scenes · {{ state.items.length }} items</span>
      </div>
      <PlayerList :players="state.players" :you-id="state.you.id" />
      <p v-if="!isHost" class="hint waiting">
        Waiting for {{ host?.name ?? 'the host' }} to start<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
      </p>
    </section>

    <template v-if="isHost">
      <button
        class="btn btn-primary btn-block start-btn"
        :disabled="count < 2 || starting"
        @click="start"
      >
        {{ starting ? 'Dealing missions…' : 'Start the game' }}
      </button>
      <p class="hint center">
        {{ count < 2 ? 'You need at least 2 players to start.' : 'Everyone in? Starting deals out the missions.' }}
      </p>
    </template>

    <details v-else class="invite-toggle">
      <summary class="field-label">Invite more players</summary>
      <QrPanel :code="state.code" />
    </details>
  </div>
</template>

<style scoped>
.lobby {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.live {
  display: flex;
  align-items: center;
  gap: 7px;
}

.live .odo {
  height: 1.3em;
  align-items: center;
}

.livedot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ok);
  animation: pulse-dot 1.6s ease-in-out infinite;
}

.players-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.pool {
  letter-spacing: 0.06em;
  font-weight: 400;
}

.waiting {
  margin-top: 12px;
}

.dots i {
  font-style: normal;
  animation: blink 1.4s infinite;
}

.dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.dots i:nth-child(3) {
  animation-delay: 0.4s;
}

.center {
  text-align: center;
}

/* breathing halo once the game can start */
.start-btn {
  position: relative;
}

@media (prefers-reduced-motion: no-preference) {
  .start-btn:not(:disabled)::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 18px;
    box-shadow: 0 0 0 2px rgba(224, 51, 64, 0.25), 0 10px 36px rgba(224, 51, 64, 0.3);
    animation: breathe-halo 2.8s ease-in-out infinite;
    pointer-events: none;
  }
}

@keyframes breathe-halo {
  0%, 100% {
    opacity: 0.25;
    transform: scale(0.99);
  }
  50% {
    opacity: 1;
    transform: scale(1.012);
  }
}

.invite-toggle summary {
  cursor: pointer;
  padding: 8px 2px;
  list-style: none;
}

.invite-toggle summary::after {
  content: ' +';
  color: var(--accent-deep);
}

.invite-toggle[open] summary::after {
  content: ' –';
}

.invite-toggle summary::-webkit-details-marker {
  display: none;
}

.invite-toggle > div {
  margin-top: 10px;
}
</style>
