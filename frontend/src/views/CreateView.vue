<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import { usePresetsStore } from '@/stores/presets'
import { toast, toastError } from '@/composables/toast'
import ChipEditor from '@/components/ChipEditor.vue'

const SCENE_SUGGESTIONS = ['Kitchen', 'Sofa', 'Balcony', 'Hallway', 'Bathroom', 'Garden']
const ITEM_SUGGESTIONS = ['Spoon', 'Pillow', 'Umbrella', 'Pen', 'Mug', 'Sock']

const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()
const presetsStore = usePresetsStore()

const name = ref('')
const scenes = ref([])
const items = ref([])
const creating = ref(false)
const presetName = ref('')

const valid = computed(
  () => name.value.trim().length > 0 && scenes.value.length > 0 && items.value.length > 0,
)

const hasList = computed(() => scenes.value.length > 0 || items.value.length > 0)
const canSaveList = computed(() => presetName.value.trim().length > 0 && hasList.value)

function loadPreset(preset) {
  scenes.value = [...preset.scenes]
  items.value = [...preset.items]
  if (!presetName.value) presetName.value = preset.name
  toast(`Loaded "${preset.name}"`, 'info')
}

function saveList() {
  if (!canSaveList.value) return
  presetsStore.save(presetName.value, scenes.value, items.value)
  toast(`List "${presetName.value.trim()}" saved`, 'info')
}

function removePreset(preset) {
  presetsStore.remove(preset.id)
}

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

    <section v-if="presetsStore.presets.length" class="card saved">
      <span class="field-label">Saved lists</span>
      <p class="hint">Tap a list to load its scenes and weapons.</p>
      <TransitionGroup name="roster" tag="ul" class="preset-list">
        <li v-for="p in presetsStore.presets" :key="p.id" class="preset-row">
          <button type="button" class="preset-load" @click="loadPreset(p)">
            <span class="preset-name">{{ p.name }}</span>
            <span class="preset-meta mono">{{ p.scenes.length }} scenes · {{ p.items.length }} weapons</span>
          </button>
          <button
            type="button"
            class="preset-del"
            :aria-label="`Delete ${p.name}`"
            @click="removePreset(p)"
          >
            ✕
          </button>
        </li>
      </TransitionGroup>
    </section>

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

      <div class="savebox" :class="{ ready: hasList }">
        <span class="field-label">Save as a list</span>
        <p class="hint">Reuse these scenes and weapons next time — no need to start a game now.</p>
        <div class="row">
          <input
            v-model="presetName"
            class="input"
            type="text"
            placeholder="Name this list, e.g. Office party"
            maxlength="40"
            autocapitalize="words"
            autocomplete="off"
            enterkeyhint="done"
            @keydown.enter.prevent="saveList"
          />
          <button class="save-btn" type="button" :disabled="!canSaveList" @click="saveList">
            Save list
          </button>
        </div>
      </div>

      <p class="hint tip">Tip: add at least as many scenes and weapons as players, so missions stay varied.</p>

      <button class="btn btn-primary btn-block" type="submit" :disabled="!valid || creating">
        {{ creating ? 'Creating room…' : 'Create room' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.saved {
  margin-bottom: 22px;
}

.saved .hint {
  margin: 4px 0 12px;
}

.preset-list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.preset-load {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 11px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: transform 0.3s var(--ease-spring), border-color 0.15s ease;
}

.preset-load:active {
  transform: scale(0.98);
  border-color: var(--accent);
  transition-duration: 0.06s;
}

.preset-name {
  font-weight: 600;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-meta {
  font-size: 11px;
  color: var(--text-dim);
}

.preset-del {
  flex-shrink: 0;
  width: 44px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.3s var(--ease-spring), color 0.15s ease, border-color 0.15s ease;
}

.preset-del:active {
  transform: scale(0.9);
  color: var(--accent);
  border-color: var(--accent);
  transition-duration: 0.06s;
}

.savebox {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.savebox.ready {
  opacity: 1;
}

.savebox .field-label {
  display: block;
}

.savebox .hint {
  margin: 5px 0 12px;
}

.row {
  display: flex;
  gap: 10px;
}

.row .input {
  flex: 1;
  min-width: 0;
}

.save-btn {
  flex-shrink: 0;
  padding: 0 18px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease, border-color 0.15s ease, transform 0.3s var(--ease-spring);
}

.save-btn:not(:disabled):active {
  border-color: var(--accent);
  transform: scale(0.96);
  transition-duration: 0.06s;
}

.save-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.tip {
  margin-bottom: 20px;
}
</style>
