<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import { toastError } from '@/composables/toast'
import ChipEditor from '@/components/ChipEditor.vue'

const SCENE_SUGGESTIONS = ['Kitchen', 'Sofa', 'Balcony', 'Hallway', 'Bathroom', 'Garden']
const ITEM_SUGGESTIONS = ['Spoon', 'Pillow', 'Umbrella', 'Pen', 'Mug', 'Sock']

const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()

const name = ref('')
const scenes = ref([])
const items = ref([])
const creating = ref(false)

const valid = computed(
  () => name.value.trim().length > 0 && scenes.value.length > 0 && items.value.length > 0,
)

async function create() {
  if (!valid.value || creating.value) return
  creating.value = true
  try {
    const creds = await api.createRoom({
      hostName: name.value.trim(),
      scenes: scenes.value,
      items: items.value,
    })
    roomStore.reset()
    sessionStore.save({ ...creds, name: name.value.trim() })
    await router.push(`/room/${creds.code}`)
  } catch (e) {
    toastError(e)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <main>
    <header class="pagehead">
      <RouterLink to="/" class="back" aria-label="Back">←</RouterLink>
      <h1>Create a room</h1>
    </header>

    <form class="stagger" @submit.prevent="create">
      <div class="field">
        <label class="field-label" for="host-name"><span class="idx">01</span>Your name</label>
        <input
          id="host-name"
          v-model="name"
          class="input"
          type="text"
          placeholder="e.g. Alex"
          maxlength="20"
          autocapitalize="words"
          autocomplete="off"
        />
      </div>

      <ChipEditor
        v-model="scenes"
        index="02"
        label="Scenes"
        placeholder="e.g. Kitchen"
        hint="Places around your party where a kill can happen."
        :suggestions="SCENE_SUGGESTIONS"
      />

      <ChipEditor
        v-model="items"
        index="03"
        label="Weapons"
        placeholder="e.g. Wooden spoon"
        hint="Everyday objects that count as the murder weapon."
        :suggestions="ITEM_SUGGESTIONS"
      />

      <p class="hint tip">Tip: add at least as many scenes and weapons as players, so missions stay varied.</p>

      <button class="btn btn-primary btn-block" type="submit" :disabled="!valid || creating">
        {{ creating ? 'Creating room…' : 'Create room' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.tip {
  margin-bottom: 20px;
}
</style>
