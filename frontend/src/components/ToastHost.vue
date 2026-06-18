<script setup>
import { toasts } from '@/composables/toast'
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.kind}`">
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: min(92vw, 24rem);
  pointer-events: none;
}

.toast {
  width: 100%;
  padding: 13px 16px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow-md);
  font-size: 14px;
  text-align: center;
}

.toast-error {
  border-color: rgba(224, 51, 64, 0.5);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-spring);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
