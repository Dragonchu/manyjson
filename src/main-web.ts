import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { useUIStore } from './stores/ui'
import { applySeoMeta } from './seo'

const useHistory = (import.meta as any).env?.VITE_HISTORY_MODE === 'history'
const router = createRouter({
	history: useHistory ? createWebHistory() : createWebHashHistory(),
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

// Enhanced per-route SEO
router.afterEach((to) => {
	const schemaName = (to.params as any).schemaName as string | undefined
	const fileName = (to.params as any).fileName as string | undefined

	let title = 'Home | ManyJson'
	let description = 'Manage JSON Schemas and JSON files efficiently with a clean, productive UI.'
	let keywords: string[] | undefined

	if (to.name === 'Schema' && schemaName) {
		title = `Schema - ${schemaName} | ManyJson`
		description = `View and validate JSON against the \`${schemaName}\` schema using ManyJson.`
		keywords = ['json schema', 'schema', schemaName, 'validation', 'ManyJson']
	} else if (to.name === 'SchemaFile' && schemaName && fileName) {
		title = `Schema - ${schemaName} - ${fileName} | ManyJson`
		description = `Edit and validate \`${fileName}\` with the \`${schemaName}\` schema in ManyJson.`
		keywords = ['json', 'json schema', schemaName, fileName, 'editor', 'validation', 'ManyJson']
	} else if (to.name === 'Home') {
		title = 'Home | ManyJson'
		description = 'ManyJson – JSON Schema and JSON file manager for productive workflows.'
		keywords = ['ManyJson', 'json', 'json schema', 'schema manager', 'editor']
	} else {
		const routeName = to.name?.toString() || 'Page'
		title = `${routeName} | ManyJson`
	}

	const canonical = window.location.href
	applySeoMeta({
		title,
		description,
		keywords,
		canonical
	})
})

