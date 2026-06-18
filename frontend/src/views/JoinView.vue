<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/api'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import { toastError } from '@/composables/toast'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()

function sanitizeCode(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

const code = ref(sanitizeCode(String(route.query.code ?? '')))
const name = ref('')
const joining = ref(false)

const valid = computed(() => code.value.length >= 4 && name.value.trim().length > 0)

function onCodeInput(e) {
  const v = sanitizeCode(e.target.value)
  code.value = v
  // write the cleaned value back: when sanitization is a no-op relative to the
  // previous state, the ref doesn't change and Vue won't patch the DOM itself
  if (e.target.value !== v) e.target.value = v
}

async function join() {
  if (!valid.value || joining.value) return
  joining.value = true
  try {
    const creds = await api.joinRoom(code.value, name.value.trim())
    roomStore.reset()
    sessionStore.save({ ...creds, name: name.value.trim() })
    await router.push(`/room/${creds.code}`)
  } catch (e) {
    toastError(e)
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <main>
    <header class="pagehead">
      <RouterLink to="/" class="back" aria-label="Back">←</RouterLink>
      <h1>Join a game</h1>
    </header>

    <form class="stagger" @submit.prevent="join">
      <div class="field">
        <label class="field-label" for="room-code"><span class="idx">01</span>Room code</label>
        <input
          id="room-code"
          :value="code"
          class="input input-code"
          type="text"
          placeholder="ABC123"
          maxlength="12"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          @input="onCodeInput"
        />
        <p class="hint">Ask the host for the code — or scan their QR code with your camera.</p>
      </div>

      <div class="field">
        <label class="field-label" for="player-name"><span class="idx">02</span>Your name</label>
        <input
          id="player-name"
          v-model="name"
          class="input"
          type="text"
          placeholder="e.g. Sam"
          maxlength="20"
          autocapitalize="words"
          autocomplete="off"
        />
      </div>

      <button class="btn btn-primary btn-block" type="submit" :disabled="!valid || joining">
        {{ joining ? 'Joining…' : 'Join the game' }}
      </button>
    </form>
  </main>
</template>
