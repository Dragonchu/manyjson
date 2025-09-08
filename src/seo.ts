import type { SeoMeta } from './types/seo'

const DEFAULT_TITLE = 'ManyJson - JSON Schema Manager'
const DEFAULT_DESCRIPTION = 'Manage JSON Schemas and JSON files efficiently with a clean, productive UI.'

function setTag(name: string, content: string | undefined) {
	if (!content) return
	let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
	if (!tag) {
		tag = document.createElement('meta')
		tag.setAttribute('name', name)
		document.head.appendChild(tag)
	}
	tag.setAttribute('content', content)
}

function setProperty(property: string, content: string | undefined) {
	if (!content) return
	let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
	if (!tag) {
		tag = document.createElement('meta')
		tag.setAttribute('property', property)
		document.head.appendChild(tag)
	}
	tag.setAttribute('content', content)
}

export function applySeoMeta(meta: SeoMeta = {}) {
	const title = meta.title || meta.openGraph?.title || meta.twitter?.title || DEFAULT_TITLE
	document.title = title

	setTag('description', meta.description || DEFAULT_DESCRIPTION)

	if (meta.noIndex) {
		setTag('robots', 'noindex, nofollow')
	} else {
		setTag('robots', 'index, follow')
	}

	setProperty('og:title', meta.openGraph?.title || title)
	setProperty('og:description', meta.openGraph?.description || meta.description || DEFAULT_DESCRIPTION)
	if (meta.openGraph?.image) setProperty('og:image', meta.openGraph.image)

	if (meta.twitter?.card) setTag('twitter:card', meta.twitter.card)
	setTag('twitter:title', meta.twitter?.title || title)
	setTag('twitter:description', meta.twitter?.description || meta.description || DEFAULT_DESCRIPTION)
	if (meta.twitter?.image) setTag('twitter:image', meta.twitter.image)

	// keywords
	if (meta.keywords && meta.keywords.length > 0) {
		setTag('keywords', meta.keywords.join(', '))
	}

	// canonical link
	if (meta.canonical) {
		let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
		if (!link) {
			link = document.createElement('link')
			link.setAttribute('rel', 'canonical')
			document.head.appendChild(link)
		}
		link.setAttribute('href', meta.canonical)
	}

	// alternates (hreflang)
	if (meta.alternates && meta.alternates.length > 0) {
		// Remove existing alternates to avoid duplicates
		document.querySelectorAll('link[rel="alternate"]').forEach((n) => n.parentElement?.removeChild(n))
		for (const alt of meta.alternates) {
			const link = document.createElement('link')
			link.setAttribute('rel', 'alternate')
			link.setAttribute('hreflang', alt.hrefLang)
			link.setAttribute('href', alt.href)
			document.head.appendChild(link)
		}
	}
}

