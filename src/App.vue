<template>
  <div id="app">
    <router-view />
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import StatusBar from '@/components/StatusBar.vue'
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

onMounted(() => {
  try {
    ui.initializeResponsive()
  } catch {}
})
</script>

<style scoped>
#app {
  height: 100vh;
  width: 100vw;
}
</style>