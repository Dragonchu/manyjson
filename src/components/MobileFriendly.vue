<template>
  <div class="mobile-friendly">
    <div class="logo">🧩</div>
    <h1>ManyJson is best on Desktop</h1>
    <p>
      For the full experience (editing schemas, managing JSON files, comparing changes),
      please open this app on your desktop or a larger screen.
    </p>
    <div class="tips">
      <ul>
        <li>Open this URL on your computer to continue.</li>
        <li>You can still browse our website content here.</li>
      </ul>
    </div>
    <button class="apple-btn filled" @click="copyCurrentUrl">Copy link</button>
    <div class="copied" v-if="copied">Link copied!</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCapability } from '@/composables/useCapability'

const { copyText } = useCapability()
const copied = ref(false)

async function copyCurrentUrl() {
  try {
    await copyText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {}
}
</script>

<style scoped>
.mobile-friendly {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--spacing-lg);
  width: 100%;
  height: 100vh;
  padding: var(--spacing-2xl);
  background: var(--apple-bg-primary);
  color: var(--apple-text-primary);
}

.logo {
  font-size: 40px;
}

h1 {
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
}

p {
  font-size: var(--text-md);
  color: var(--apple-text-secondary);
}

.tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  color: var(--apple-text-secondary);
}

.copied {
  font-size: var(--text-sm);
  color: var(--accent-success);
}
</style>

