import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { useUIStore } from './stores/ui'

// Create router for potential future routing needs
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue')
    }
  ]
})

// Create Pinia store
const pinia = createPinia()

// Create and mount the Vue app
const app = createApp(App)

app.use(pinia)
app.use(router)

// Initialize theme system after Pinia is set up
app.mount('#app')

// Initialize theme and keyboard shortcuts after mounting
const uiStore = useUIStore()
uiStore.initializeTheme()
uiStore.initializeKeyboardShortcuts()