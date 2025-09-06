import { detectPlatform } from './index'
import { WebPlatformApis, webCapabilities } from './web'
import { DesktopPlatformApis, desktopCapabilities } from './desktop'

export function getPlatformRuntime() {
	const name = detectPlatform()
	if (name === 'desktop') {
		return { name, capabilities: desktopCapabilities, apis: DesktopPlatformApis }
	}
	return { name, capabilities: webCapabilities, apis: WebPlatformApis }
}

