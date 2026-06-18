<script setup>
import { computed, ref, watch } from 'vue'
import { useRoomStore } from '@/stores/room'
import { toastError } from '@/composables/toast'
import HoldButton from '@/components/HoldButton.vue'

const props = defineProps({ state: { type: Object, required: true } })

const roomStore = useRoomStore()
const hidden = ref(false)
const reporting = ref(false)
/** Briefly true when the alive count drops — the body count ticks red. */
const tick = ref(false)
let tickTimer

const mission = computed(() => props.state.mission)
const aliveCount = computed(() => props.state.players.filter((p) => p.alive).length)

watch(aliveCount, (next, prev) => {
  if (next < prev) {
    tick.value = true
    navigator.vibrate?.(30)
    window.clearTimeout(tickTimer)
    tickTimer = window.setTimeout(() => (tick.value = false), 1300)
  }
})

async function reportDeath() {
  reporting.value = true
  try {
    await roomStore.reportEliminated()
  } catch (e) {
    toastError(e)
  } finally {
    reporting.value = false
  }
}
</script>

<template>
  <div class="missionpanel">
    <Transition name="flash">
      <p v-if="roomStore.newTarget" class="newtarget mono">▸ New target acquired</p>
    </Transition>

    <section
      v-if="mission"
      class="card reticle mission"
      :class="{ hidden }"
      @click="hidden && (hidden = false)"
    >
      <div class="m-head">
        <span class="eyebrow">Your mission</span>
        <button class="hide-btn mono" type="button" @click.stop="hidden = !hidden">
          {{ hidden ? 'Show' : 'Hide' }}
        </button>
      </div>

      <div class="m-body" :class="{ blurred: hidden }">
        <p class="m-directive mono" :style="{ '--i': 0 }">Eliminate</p>
        <Transition name="rolodex" mode="out-in">
          <h2 :key="mission.targetName" class="m-target serif">{{ mission.targetName }}</h2>
        </Transition>
        <hr class="divider draw" :style="{ '--i': 2 }" />
        <dl class="m-rows">
          <div class="m-row" :style="{ '--i': 3 }">
            <dt class="field-label"><span class="idx">01</span>Scene</dt>
            <dd>{{ mission.scene }}</dd>
          </div>
          <div class="m-row" :style="{ '--i': 4 }">
            <dt class="field-label"><span class="idx">02</span>Weapon</dt>
            <dd>{{ mission.item }}</dd>
          </div>
        </dl>
        <hr class="divider draw" :style="{ '--i': 5 }" />
        <p class="m-brief hint" :style="{ '--i': 6 }">
          Catch {{ mission.targetName }} at <strong>{{ mission.scene }}</strong> and strike with
          <strong>{{ mission.item }}</strong>. Then have them report the kill here.
        </p>
      </div>

      <div v-if="hidden" class="classified" aria-hidden="true">
        <span class="stamp">Classified — tap to view</span>
      </div>
    </section>

    <div class="bodycount" :class="{ tick }">
      <span class="odo big">
        <Transition name="roll">
          <span :key="aliveCount" class="num serif">{{ aliveCount }}</span>
        </Transition>
      </span>
      <span class="of serif">/ {{ state.players.length }}</span>
      <span class="cap mono">
        still alive<template v-if="state.you.kills"> · you: {{ state.you.kills }}</template>
      </span>
    </div>

    <section class="danger">
      <span class="field-label">Were you eliminated?</span>
      <HoldButton
        label="Hold to confirm your death"
        hold-label="Confirming…"
        :disabled="reporting"
        @confirm="reportDeath"
      />
      <p class="hint">
        When someone gets you, confirm it here — your mission passes on to them. This can't be undone.
      </p>
    </section>
  </div>
</template>

<style scoped>
.missionpanel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.newtarget {
  padding: 11px 16px;
  border-radius: var(--radius-sm);
  background: var(--accent-deep);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mission {
  position: relative;
}

.m-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.hide-btn {
  position: relative;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  background: var(--surface);
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  cursor: pointer;
}

/* invisible extended hit area — small visual, 44px-class touch target */
.hide-btn::after {
  content: '';
  position: absolute;
  inset: -12px;
}

.m-body {
  transition: filter 0.25s ease, opacity 0.25s ease;
}

.m-body.blurred {
  filter: blur(16px);
  opacity: 0.45;
  pointer-events: none;
  user-select: none;
}

.m-directive {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.m-target {
  position: relative;
  display: inline-block;
  margin: 2px 0 16px;
  font-size: 44px;
  font-weight: 650;
  font-style: italic;
  line-height: 1.08;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

/* redaction bar: the name starts censored, then gets declassified */
.m-target::after {
  content: '';
  position: absolute;
  inset: 8% -3%;
  background: var(--ink);
  border-radius: 3px;
  transform-origin: right;
}

@media (prefers-reduced-motion: no-preference) {
  .m-target::after {
    animation: unredact 0.55s var(--ease-out) 0.8s both;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-target::after {
    display: none;
  }
}

@keyframes unredact {
  to {
    transform: scaleX(0);
  }
}

.rolodex-enter-active,
.rolodex-leave-active {
  transition: transform 0.3s var(--ease-out), opacity 0.3s var(--ease-out);
}

.rolodex-enter-from {
  transform: translateY(55%);
  opacity: 0;
}

.rolodex-leave-to {
  transform: translateY(-55%);
  opacity: 0;
}

.m-rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.m-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 13px 0;
}

.m-row + .m-row {
  border-top: 1px solid var(--border);
}

.m-row dd {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.m-brief {
  margin-top: 14px;
}

/* dossier declassify choreography: rows type out, hairlines draw themselves */
@media (prefers-reduced-motion: no-preference) {
  .m-directive,
  .m-row,
  .m-brief {
    animation: rise 0.5s var(--ease-out) both;
    animation-delay: calc(var(--i) * 80ms + 0.15s);
  }

  .divider.draw {
    transform-origin: left;
    animation: draw-x 0.55s var(--ease-out) both;
    animation-delay: calc(var(--i) * 80ms + 0.15s);
  }
}

@keyframes draw-x {
  from {
    transform: scaleX(0);
  }
}

.classified {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.classified .stamp {
  transform: rotate(-7deg);
  background: var(--surface);
}

/* body count: big serif numeral with odometer roll, ticks red on a kill */
.bodycount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.odo.big {
  height: 54px;
  align-items: flex-end;
}

.num {
  font-size: 52px;
  font-weight: 650;
  line-height: 1;
  color: var(--ink);
  transition: color 0.9s ease;
}

.bodycount.tick .num {
  color: var(--accent);
  transition: none;
}

.of {
  font-size: 20px;
  color: var(--text-dim);
}

.cap {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.danger {
  display: grid;
  gap: 10px;
  margin-top: 6px;
  padding-top: 20px;
  border-top: 1px dashed rgba(224, 51, 64, 0.4);
}
</style>
