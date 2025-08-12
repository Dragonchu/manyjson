<template>
  <div id="app">
    <router-view />
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import StatusBar from '@/components/StatusBar.vue'
</script>

<style scoped>
#app {
  height: 100vh;
  width: 100vw;
}
</style>