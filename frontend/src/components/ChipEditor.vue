<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, required: true },
  hint: { type: String, default: '' },
  index: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
})

const model = defineModel({ type: Array, required: true })
const draft = ref('')

const remainingSuggestions = computed(() =>
  props.suggestions.filter((s) => !model.value.some((v) => v.toLowerCase() === s.toLowerCase())),
)

function add(value = draft.value) {
  const v = value.trim().slice(0, 30)
  if (!v) return
  if (!model.value.some((existing) => existing.toLowerCase() === v.toLowerCase())) {
    model.value = [...model.value, v]
  }
  draft.value = ''
}

function remove(index) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="field">
    <span class="field-label"><span v-if="index" class="idx">{{ index }}</span>{{ label }}</span>
    <div class="row">
      <input
        v-model="draft"
        class="input"
        type="text"
        :placeholder="placeholder"
        maxlength="30"
        autocapitalize="words"
        autocomplete="off"
        enterkeyhint="done"
        @keydown.enter.prevent="add()"
      />
      <button class="add-btn" type="button" :disabled="!draft.trim()" @click="add()">Add</button>
    </div>
    <p v-if="hint" class="hint">{{ hint }}</p>

    <TransitionGroup v-if="model.length" name="chips" tag="div" class="chips">
      <button
        v-for="(chip, i) in model"
        :key="chip"
        type="button"
        class="chip"
        :aria-label="`Remove ${chip}`"
        @click="remove(i)"
      >
        {{ chip }}<span class="chip-x">✕</span>
      </button>
    </TransitionGroup>

    <div v-if="remainingSuggestions.length" class="chips">
      <button
        v-for="s in remainingSuggestions"
        :key="s"
        type="button"
        class="chip chip-suggest"
        @click="add(s)"
      >
        + {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 10px;
}

.row .input {
  flex: 1;
  min-width: 0;
}

.add-btn {
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

.add-btn:not(:disabled):active {
  border-color: var(--accent);
  transform: scale(0.94);
  transition-duration: 0.06s;
}

.add-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 13px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.chip-x {
  font-size: 10px;
  color: var(--text-dim);
}

.chip-suggest {
  background: transparent;
  border-style: dashed;
  box-shadow: none;
  color: var(--text-dim);
}

.chips-enter-active {
  transition: opacity 0.3s var(--ease-spring), transform 0.3s var(--ease-spring);
}

.chips-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.chips-enter-from,
.chips-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
