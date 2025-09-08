import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { useUIStore } from './stores/ui'
import { applySeoMeta } from './seo'

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: '/', name: 'Home', component: () => import('./views/Home.vue') },
		{ path: '/schema/:schemaName', name: 'Schema', component: () => import('./views/Home.vue') },
		{ path: '/schema/:schemaName/file/:fileName', name: 'SchemaFile', component: () => import('./views/Home.vue') }
	]
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')

const uiStore = useUIStore()
uiStore.initializeTheme()
uiStore.initializeLayout()
uiStore.initializeKeyboardShortcuts()

// Basic per-route SEO (desktop title consistency)
router.afterEach((to) => {
  const schemaName = (to.params as any).schemaName as string | undefined
  const fileName = (to.params as any).fileName as string | undefined

  let title = 'Home | ManyJson'
  if (to.name === 'Schema' && schemaName) {
    title = `Schema - ${schemaName} | ManyJson`
  } else if (to.name === 'SchemaFile' && schemaName && fileName) {
    title = `Schema - ${schemaName} - ${fileName} | ManyJson`
  } else if (to.name && to.name !== 'Home') {
    title = `${to.name.toString()} | ManyJson`
  }

  applySeoMeta({
    title,
    description: 'ManyJson – JSON Schema and JSON file manager for productive workflows.'
  })
})

