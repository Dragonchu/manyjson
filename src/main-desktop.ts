import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { useUIStore } from './stores/ui'

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

