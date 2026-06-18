<script setup>
import { computed, ref } from 'vue'
import { renderSVG } from 'uqr'
import { toast } from '@/composables/toast'

const props = defineProps({ code: { type: String, required: true } })

const copied = ref(false)
let copiedTimer

const codeChars = computed(() => props.code.split(''))
const joinUrl = computed(() => `${location.origin}/join?code=${props.code}`)

const qrSvg = computed(() =>
  renderSVG(joinUrl.value, { border: 2, blackColor: '#17151c', whiteColor: '#ffffff' }),
)

const canShare = typeof navigator.share === 'function'

/** navigator.clipboard only exists on secure origins — LAN http:// needs this. */
function legacyCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}

async function copyCode() {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(props.code)
    } else if (!legacyCopy(props.code)) {
      throw new Error('copy unsupported')
    }
    copied.value = true
    navigator.vibrate?.(15)
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    toast('Could not copy — write it down instead')
  }
}

async function share() {
  try {
    await navigator.share({
      title: 'MurderList',
      text: `Join my MurderList game — code ${props.code}`,
      url: joinUrl.value,
    })
  } catch {
    /* user dismissed the share sheet */
  }
}
</script>

<template>
  <div class="invite">
    <section class="ticket" :class="{ copied }">
      <div class="t-top">
        <p class="eyebrow">Room code</p>
        <button class="code" type="button" :aria-label="`Copy room code ${code}`" @click="copyCode">
          <span v-for="(ch, i) in codeChars" :key="`${code}-${i}`" class="cc">
            <span class="cc-in mono" :style="{ '--i': i }">{{ ch }}</span>
          </span>
        </button>
        <span class="odo hint-roll">
          <Transition name="roll" mode="out-in">
            <p :key="copied" class="tap-hint mono" :class="{ ok: copied }">
              {{ copied ? 'Copied ✓' : 'Tap code to copy' }}
            </p>
          </Transition>
        </span>
      </div>

      <div class="perf" aria-hidden="true"></div>

      <div class="t-bottom">
        <div class="qr" aria-hidden="true" v-html="qrSvg"></div>
        <p class="hint">Scan with a phone camera to join,<br />or enter the code on the join screen.</p>
        <p class="micro mono">Admit anyone · one life each · non-transferable</p>
        <div class="barcode" aria-hidden="true"></div>
      </div>
    </section>

    <button v-if="canShare" class="btn btn-ghost btn-block share" type="button" @click="share">
      Share invite link
    </button>
  </div>
</template>

<style scoped>
.invite {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ticket {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 22px 20px;
  text-align: center;
}

@media (prefers-reduced-motion: no-preference) {
  .ticket.copied {
    animation: tear 0.5s var(--ease-snap);
  }
}

@keyframes tear {
  30% {
    transform: rotate(-1.4deg) translateY(-3px);
  }
}

.t-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.code {
  display: flex;
  gap: 0.32em;
  border: none;
  background: none;
  padding: 6px 0 0;
  font-size: 36px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
}

.cc {
  display: inline-block;
  overflow: hidden;
}

.cc-in {
  display: inline-block;
}

@media (prefers-reduced-motion: no-preference) {
  /* split-flap board: characters settle one by one */
  .cc-in {
    animation: cc-rise 0.5s var(--ease-out) both;
    animation-delay: calc(var(--i) * 55ms + 0.15s);
  }
}

@keyframes cc-rise {
  from {
    transform: translateY(105%);
  }
}

.hint-roll {
  justify-content: center;
}

.tap-hint {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.tap-hint.ok {
  color: var(--ok-deep);
}

/* perforation with punched notches */
.perf {
  position: relative;
  height: 0;
  border-top: 1px dashed var(--border-strong);
  margin: 18px -20px;
}

.perf::before,
.perf::after {
  content: '';
  position: absolute;
  top: -9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--border);
}

.perf::before {
  left: -10px;
}

.perf::after {
  right: -10px;
}

.t-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.qr {
  width: min(190px, 60%);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  line-height: 0;
}

.qr :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

.micro {
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.barcode {
  width: 62%;
  height: 22px;
  background: repeating-linear-gradient(
    90deg,
    var(--ink) 0 2px,
    transparent 2px 5px,
    var(--ink) 5px 6px,
    transparent 6px 10px,
    var(--ink) 10px 13px,
    transparent 13px 16px
  );
  opacity: 0.8;
}
</style>
