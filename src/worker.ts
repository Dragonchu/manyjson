// Cloudflare Workers 入口文件
export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url)

        // 处理 API 路由
        if (url.pathname.startsWith('/api/')) {
            return handleApiRequest(request, env)
        }

        // 处理静态资源 - 从构建后的 dist 目录获取
        if (url.pathname.includes('.')) {
            return handleStaticAsset(request, env)
        }

        // 默认返回构建后的 index-web.html
        return handleStaticAsset(new Request(new URL('/index-web.html', request.url)), env)
    },
}

async function handleApiRequest(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    switch (path) {
        case '/api/health':
            return new Response(JSON.stringify({ status: 'ok' }), {
                headers: { 'Content-Type': 'application/json' }
            })

        default:
            return new Response('Not Found', { status: 404 })
    }
}

async function handleStaticAsset(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // 使用 Cloudflare Workers 的 ASSETS 绑定来获取静态资源
    if (env.ASSETS) {
        return env.ASSETS.fetch(request)
    }

    // 如果没有 ASSETS 绑定，返回 404
    return new Response('Static asset not found', { status: 404 })
}

