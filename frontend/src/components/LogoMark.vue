<script setup>
defineProps({
  size: { type: Number, default: 56 },
  /** Adds a slowly rotating dashed scan ring (hero usage). */
  animated: { type: Boolean, default: false },
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle
      v-if="animated"
      class="scan-ring"
      cx="24"
      cy="24"
      r="21"
      stroke="var(--accent)"
      stroke-width="1"
      stroke-dasharray="2.5 6"
      opacity="0.55"
    />
    <circle cx="24" cy="24" r="12.5" stroke="var(--accent)" stroke-width="2.5" />
    <circle cx="24" cy="24" r="3" fill="var(--accent)" />
    <path
      d="M24 5.5v7M24 35.5v7M5.5 24h7M35.5 24h7"
      stroke="var(--accent)"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .scan-ring {
    transform-box: view-box;
    transform-origin: center;
    animation: spin 16s linear infinite;
  }
}
</style>
