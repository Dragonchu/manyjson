import { computed } from 'vue'
import { getPlatformRuntime } from '@/platform/runtime'

export function useCapability() {
	const runtime = getPlatformRuntime()

	function is(cap: keyof typeof runtime.capabilities) {
		return runtime.capabilities[cap]
	}

	async function copyText(text: string) {
		return runtime.apis.writeClipboardText(text)
	}

	return {
		runtime,
		is,
		copyText,
		name: computed(() => runtime.name)
	}
}

