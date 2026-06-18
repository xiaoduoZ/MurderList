<script setup>
defineProps({
  players: { type: Array, required: true },
  youId: { type: String, default: '' },
  /** Show alive/dead state and kill counts (in-game views). */
  showStatus: { type: Boolean, default: false },
})

/** Stable soft pastel derived from the name. */
function avatarStyle(name) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) % 360
  return {
    background: `hsl(${hash} 55% 90%)`,
    color: `hsl(${hash} 45% 30%)`,
  }
}
</script>

<template>
  <TransitionGroup name="roster" tag="ul" class="plist">
    <li v-for="p in players" :key="p.id" class="prow" :class="{ dead: showStatus && !p.alive }">
      <span class="avatar" :style="avatarStyle(p.name)" aria-hidden="true">
        {{ p.name.charAt(0).toUpperCase() }}
      </span>
      <span class="pname">
        {{ p.name }}
        <span v-if="p.id === youId" class="you mono">you</span>
      </span>
      <span class="pmeta">
        <span v-if="showStatus && p.kills > 0" class="kills mono">
          {{ p.kills }} {{ p.kills === 1 ? 'kill' : 'kills' }}
        </span>
        <span v-if="p.isHost" class="tag">Host</span>
        <span v-if="showStatus && !p.alive" class="tag tag-dead">Out</span>
        <span v-else-if="showStatus" class="dot-alive" aria-label="alive"></span>
      </span>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.plist {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.prow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 6px;
  margin: 0 -6px;
  border-radius: 10px;
  border-bottom: 1px solid var(--border);
  transition: opacity 0.3s ease;
}

.prow:last-child {
  border-bottom: none;
}

.prow.dead {
  opacity: 0.45;
}

.prow.dead .pname {
  text-decoration: line-through;
  text-decoration-color: var(--accent);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 15px;
  font-weight: 600;
}

.pname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.you {
  margin-left: 4px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.pmeta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.kills {
  font-size: 11px;
  color: var(--text-dim);
}

.dot-alive {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ok);
}
</style>
