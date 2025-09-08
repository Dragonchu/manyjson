import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DIST_DIR = join(process.cwd(), 'dist')
if (!existsSync(DIST_DIR)) {
	mkdirSync(DIST_DIR, { recursive: true })
}

const SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || ''
const now = new Date().toISOString().split('T')[0]

// Core static routes only; dynamic routes require known data at build time
const routes = [
	{ path: '/', changefreq: 'weekly', priority: 1.0 }
]

function buildUrl(path) {
	if (SITE_URL) return SITE_URL.replace(/\/$/, '') + path
	// Fallback to relative for local preview; not ideal for public sitemaps
	return path
}

function generateSitemapXml() {
	const urls = routes.map((r) => {
		return `  <url>\n    <loc>${buildUrl(r.path)}</loc>\n    <changefreq>${r.changefreq || 'weekly'}</changefreq>\n    <priority>${r.priority ?? 0.8}</priority>\n    <lastmod>${now}</lastmod>\n  </url>`
	}).join('\n')
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function generateRobotsTxt() {
	let lines = [
		'User-agent: *',
		'Allow: /'
	]
	if (SITE_URL) {
		lines.push(`Sitemap: ${SITE_URL.replace(/\/$/, '')}/sitemap.xml`)
	}
	return lines.join('\n') + '\n'
}

// Write files
const sitemapPath = join(DIST_DIR, 'sitemap.xml')
writeFileSync(sitemapPath, generateSitemapXml(), 'utf8')

const robotsPath = join(DIST_DIR, 'robots.txt')
writeFileSync(robotsPath, generateRobotsTxt(), 'utf8')

console.log(`[seo] Wrote ${sitemapPath} and ${robotsPath}${SITE_URL ? '' : ' (no SITE_URL provided)'}`)

