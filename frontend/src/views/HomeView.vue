<script setup>
import { useRouter } from 'vue-router'
import { isMockApi } from '@/api'
import { useSessionStore } from '@/stores/session'
import { useRoomStore } from '@/stores/room'
import LogoMark from '@/components/LogoMark.vue'

const LETTERS = 'MURDERLIST'.split('')

const router = useRouter()
const sessionStore = useSessionStore()
const roomStore = useRoomStore()

function rejoin() {
  const s = sessionStore.session
  if (s) router.push(`/room/${s.code}`)
}

function leave() {
  roomStore.reset()
  sessionStore.clear()
}
</script>

<template>
  <main class="home">
    <div class="hero">
      <LogoMark :size="76" animated class="mark" />
      <h1 class="title wordmark" aria-label="MurderList.">
        <span
          v-for="(ch, i) in LETTERS"
          :key="i"
          class="ch"
          aria-hidden="true"
          :style="{ '--i': i, '--off': `${(i - 4.5) * 16}px` }"
        >{{ ch }}</span><span class="ch dot" aria-hidden="true" :style="{ '--i': LETTERS.length }">.</span>
      </h1>
      <p class="tagline mono">One circle. One survivor.</p>
      <p class="subline serif">Find them before they find you.</p>
    </div>

    <section v-if="sessionStore.session" class="card resume reticle">
      <span class="eyebrow">Game in progress</span>
      <p class="resume-line">
        You're in room <strong class="mono">{{ sessionStore.session.code }}</strong> as
        {{ sessionStore.session.name }}.
      </p>
      <button class="btn btn-primary btn-block" type="button" @click="rejoin">Rejoin game</button>
      <button class="btn-text" type="button" @click="leave">Leave that game</button>
    </section>

    <div class="actions stagger">
      <RouterLink class="btn btn-primary btn-block" to="/create">Create a room</RouterLink>
      <RouterLink class="btn btn-ghost btn-block" to="/join">Join with a code</RouterLink>
    </div>

    <details class="howto">
      <summary class="field-label">How to play</summary>
      <ol class="steps">
        <li>The host sets the scenes and weapons, then shares a room code.</li>
        <li>Everyone gets a secret mission: a target, a scene and a weapon.</li>
        <li>Catch your target in the right scene with the right weapon — your victim confirms the kill on their phone.</li>
        <li>You inherit their mission. Last player alive wins.</li>
      </ol>
    </details>

    <footer class="foot">
      <p class="hint">A real-world elimination game. Gather your friends, trust no one.</p>
      <p v-if="isMockApi" class="mock mono">Demo mode — no server connected</p>
    </footer>
  </main>
</template>

<style scoped>
.home {
  justify-content: center;
  gap: 26px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 24px 0 4px;
}

.mark {
  margin-bottom: 14px;
}

.title {
  font-size: 34px;
  line-height: 1;
  white-space: nowrap;
}

.ch {
  display: inline-block;
}

/* type lock-up: letters converge into the final tracking, dot pops last */
@media (prefers-reduced-motion: no-preference) {
  .ch {
    opacity: 0;
    transform: translateX(var(--off, 0));
    animation: lockup 0.7s var(--ease-out) forwards;
    animation-delay: calc(var(--i) * 30ms + 0.05s);
  }

  .ch.dot {
    --off: 0px;
    transform: scale(0);
    animation-name: dotpop;
    animation-timing-function: var(--ease-spring);
    animation-delay: calc(var(--i) * 30ms + 0.2s);
  }
}

@keyframes lockup {
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes dotpop {
  60% {
    opacity: 1;
    transform: scale(1.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tagline {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.subline {
  font-size: 17px;
  font-style: italic;
  color: var(--ink);
  opacity: 0.85;
}

.resume {
  display: grid;
  gap: 10px;
  text-align: center;
}

.resume-line {
  font-size: 14px;
}

.actions {
  display: grid;
  gap: 12px;
}

.howto summary {
  cursor: pointer;
  text-align: center;
  padding: 4px;
  list-style: none;
}

.howto summary::after {
  content: ' +';
  color: var(--accent-deep);
}

.howto[open] summary::after {
  content: ' –';
}

.howto summary::-webkit-details-marker {
  display: none;
}

.steps {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
  display: grid;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text-dim);
}

.steps li {
  counter-increment: step;
  position: relative;
  padding: 10px 0 10px 34px;
  border-top: 1px solid var(--border);
}

.steps li::before {
  content: counter(step, decimal-leading-zero);
  position: absolute;
  left: 0;
  top: 11px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-deep);
}

.foot {
  text-align: center;
  display: grid;
  gap: 8px;
}

.mock {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-deep);
  opacity: 0.85;
}
</style>
