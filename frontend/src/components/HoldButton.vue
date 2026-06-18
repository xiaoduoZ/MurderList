<script setup>
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  holdLabel: { type: String, default: 'Keep holding…' },
  holdMs: { type: Number, default: 1300 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm'])

const pressing = ref(false)
let timers = []

function beginHold() {
  if (props.disabled || pressing.value) return
  pressing.value = true
  // heartbeat haptics while the hold arms itself
  timers = [0.25, 0.5, 0.75].map((pct) =>
    window.setTimeout(() => navigator.vibrate?.(12), props.holdMs * pct),
  )
  timers.push(
    window.setTimeout(() => {
      pressing.value = false
      navigator.vibrate?.(120)
      emit('confirm')
    }, props.holdMs),
  )
}

function onPointerDown(e) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    /* synthetic events or unsupported browsers — hold still works */
  }
  beginHold()
}

/* keyboard path: hold Enter or Space for the same duration */
function onKeyDown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
    e.preventDefault()
    beginHold()
  }
}

function onKeyUp(e) {
  if (e.key === 'Enter' || e.key === ' ') cancel()
}

function cancel() {
  pressing.value = false
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

onBeforeUnmount(cancel)
</script>

<template>
  <button
    class="hold-btn"
    :class="{ pressing }"
    :style="{ '--hold-ms': `${holdMs}ms` }"
    :disabled="disabled"
    type="button"
    @pointerdown.prevent="onPointerDown"
    @pointerup="cancel"
    @pointercancel="cancel"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @blur="cancel"
    @contextmenu.prevent
  >
    <span class="fill"></span>
    <span class="label">{{ pressing ? holdLabel : label }}</span>
  </button>
</template>

<style scoped>
.hold-btn {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 56px;
  border: 1px solid rgba(224, 51, 64, 0.55);
  border-radius: 14px;
  background: var(--accent-soft);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-deep);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.hold-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.fill {
  position: absolute;
  inset: 0;
  background: var(--accent-deep);
  transform: scaleX(0);
  transform-origin: left;
  /* springy recoil when the hold is aborted early */
  transition: transform 0.4s var(--ease-snap);
}

.pressing .fill {
  transform: scaleX(1);
  transition: transform var(--hold-ms) linear;
}

/* the fill is FUNCTIONAL progress feedback, not decorative motion — restore
   its duration under the global reduced-motion kill rule in main.css */
@media (prefers-reduced-motion: reduce) {
  .pressing .fill {
    transition-duration: var(--hold-ms) !important;
  }
}

.label {
  position: relative;
  z-index: 1;
  transition: color 0.2s ease;
}

.pressing .label {
  color: #fff;
}

/* the button strains in the final stretch of the hold */
@media (prefers-reduced-motion: no-preference) {
  .pressing {
    animation: tremble 0.28s linear infinite;
    animation-delay: calc(var(--hold-ms) * 0.6);
  }
}

@keyframes tremble {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(1.4px); }
  75% { transform: translateX(-1.4px); }
}
</style>
