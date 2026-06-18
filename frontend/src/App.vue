<script setup>
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ToastHost from './components/ToastHost.vue'

// Spatial navigation: drilling deeper slides forward, going home slides back.
const DEPTH = { home: 0, create: 1, join: 1, room: 2 }

const transitionName = ref('page-fade')
const router = useRouter()

router.afterEach((to, from) => {
  if (!from.name) {
    transitionName.value = 'page-fade'
    return
  }
  transitionName.value = (DEPTH[to.name] ?? 0) >= (DEPTH[from.name] ?? 0) ? 'page-fwd' : 'page-back'
})

/* route changes are otherwise silent to assistive tech: move focus to the
   freshly mounted view once its enter transition finishes */
let firstEnter = true
function focusView(el) {
  if (firstEnter) {
    firstEnter = false // don't steal focus on initial page load
    return
  }
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in" @after-enter="focusView">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
