# SEO 指南（ManyJson）

本说明文档概述本项目的基础 SEO 实施与后续优化计划，包括：
- 已实现：基础与社交分享 meta 标签、按路由设置标题/描述
- 接口定义：`SeoMeta`、`SitemapEntry`
- 规划：站点结构与 `sitemap.xml`/`robots.txt`

## 1) 已实现内容

- 在 `index.html` 中添加了基础与社交 meta：`description`、`robots`、Open Graph、Twitter Card 等。
- 新增 `src/seo.ts`，提供 `applySeoMeta(meta: SeoMeta)` 方法，可在路由切换时动态设置页面标题与描述。
- 在 `src/main-web.ts` 与 `src/main-desktop.ts` 里通过 `router.afterEach` 调用 `applySeoMeta`，根据路由名称与参数设置 `title`。

用法示例（如果某路由需要自定义更丰富的文案，可在导航后手动调用）：

```ts
import { applySeoMeta } from '@/seo'

applySeoMeta({
  title: 'Schema - product.json | ManyJson',
  description: 'Validate product.json against product schema using ManyJson.'
})
```

## 2) 接口定义

- `src/types/seo.ts`

```ts
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
```

扩展建议（如需）：
- `canonical?: string`（规范化链接）
- `alternates?: Array<{ hrefLang: string; href: string }>`（多语言/区域）
- `keywords?: string[]`

## 3) 站点结构与可索引性

当前 Web 端使用 `hash` 路由（`createWebHashHistory`），可被搜索引擎索引，但不如服务端渲染/静态化友好。后续如需进一步 SEO：
- Web 端可改为 `createWebHistory` 并配置服务端回退（需要部署静态托管服务支持）。
- 对关键页面做静态导出（预渲染），提供实际 HTML 内容给爬虫。

Electron 端不涉 SEO 收录，但保持一致的标题/描述有利于统一代码路径。

## 4) Sitemap 与 Robots 规划

- 生成 `sitemap.xml`：
  - 在构建阶段，根据静态路由与可枚举数据生成 `SitemapEntry[]`，序列化为 `sitemap.xml` 输出到 `dist/`。
  - 动态路由（如 `schema/:schemaName`）若可在构建时获取数据清单，可一并展开；否则仅列出核心静态页面。
- `robots.txt`：
  - 提供站点抓取策略，并指向 `sitemap.xml`，示例：

```txt
User-agent: *
Allow: /
Sitemap: https://your-domain.example/sitemap.xml
```

建议新增一个简易 node 脚本（后续任务）：
- 读取内部路由与数据清单 -> 生成 `SitemapEntry[]` -> 写入 `dist/sitemap.xml`。
- 同时在 `dist/` 写入 `robots.txt`（或放置于 `public/` 以便 Vite 原样拷贝）。

## 5) 命名与文案

- 标题规范：`<页面名称> | ManyJson`，带参数时：`<页面名称> - <参数...> | ManyJson`。
- 描述文案保持 50-160 字符，聚焦“管理 JSON Schema 与 JSON 文件、高效、清爽 UI”。
- Open Graph 与 Twitter 文案尽量与标题、描述一致；如后续有品牌配图，可设置 `image`。

## 6) 后续任务建议

- [ ] 若上线 Web 端：提供 `public/robots.txt` 和构建期 `sitemap.xml` 生成脚本
- [ ] 路由改为 `history`（若后端/托管允许），或对核心页面进行预渲染
- [ ] 扩展 `SeoMeta`：`canonical`、`alternates`、`keywords`
- [ ] 为主要页面补充定制化 `applySeoMeta` 调用（更精准的标题/描述）