export interface SeoMeta {
	title?: string
	description?: string
	noIndex?: boolean
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

