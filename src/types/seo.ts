export interface SeoMeta {
	title?: string
	description?: string
	noIndex?: boolean
	/** Canonical URL for the current page */
	canonical?: string
	/** Alternate language/region URLs */
	alternates?: Array<{ hrefLang: string; href: string }>
	/** Comma-joined when rendered */
	keywords?: string[]
	openGraph?: {
		title?: string
		description?: string
		image?: string
	}
	twitter?: {
		card?: 'summary' | 'summary_large_image'
		title?: string
		description?: string
		image?: string
	}
}

export interface SitemapEntry {
	path: string
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
	priority?: number
	lastmod?: string
}

