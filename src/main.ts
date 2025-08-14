import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

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

// Add error handling for router
router.onError((error) => {
  console.error('Router error:', error)
})

// Create Pinia store
const pinia = createPinia()

// Create and mount the Vue app
const app = createApp(App)

// Add error handling for the app
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
}

app.use(pinia)
app.use(router)

// Mount the Vue app with error handling
try {
  app.mount('#app')
} catch (error) {
  console.error('Failed to mount Vue app:', error)
  // Show error message in the DOM
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: rgba(255, 255, 255, 0.95); font-family: 'Inter', sans-serif;">
        <div style="text-align: center; max-width: 500px; padding: 20px;">
          <div style="color: #ef4444; margin-bottom: 16px; font-size: 18px;">⚠️ Application Error</div>
          <div style="margin-bottom: 16px;">Failed to load the application. Please check the console for details.</div>
          <div style="font-family: monospace; background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 6px; font-size: 12px; color: rgba(255, 255, 255, 0.7);">${error.message}</div>
        </div>
      </div>
    `
  }
}