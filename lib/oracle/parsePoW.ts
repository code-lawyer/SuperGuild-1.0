/**
 * PoW (Proof of Work) 智能抓取模块
 *
 * 根据 URL 类型自动路由到最佳抓取策略：
 * - GitHub PR/Commit → GitHub REST API (读取 diff + commit messages)
 * - 通用 URL → Jina Reader API (转 Markdown)
 * - 兜底 → 标记为不可读
 */

export interface PoWResult {
    url: string
    success: boolean
    content: string // Markdown text
    source: 'github-pr' | 'github-repo' | 'jina' | 'raw-text' | 'failed'
    charCount: number
}

// ── GitHub PR/Commit detection ──
const GITHUB_PR_RE = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
const GITHUB_COMMIT_RE = /github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/
const GITHUB_REPO_RE = /github\.com\/([^/]+)\/([^/]+)\/?$/

/**
 * 抓取单个 PoW URL 的内容
 */
export async function parsePoWUrl(url: string): Promise<PoWResult> {
    const fail = (reason: string): PoWResult => ({
        url,
        success: false,
        content: `[抓取失败] ${reason}`,
        source: 'failed',
        charCount: 0,
    })

    try {
        // ── 1. GitHub PR ──
        const prMatch = url.match(GITHUB_PR_RE)
        if (prMatch) {
            return await fetchGitHubPR(prMatch[1], prMatch[2], Number(prMatch[3]), url)
        }

        // ── 2. GitHub Commit ──
        const commitMatch = url.match(GITHUB_COMMIT_RE)
        if (commitMatch) {
            return await fetchGitHubCommit(commitMatch[1], commitMatch[2], commitMatch[3], url)
        }

        // ── 3. GitHub Repo ──
        const repoMatch = url.match(GITHUB_REPO_RE)
        if (repoMatch) {
            return await fetchGitHubRepo(repoMatch[1], repoMatch[2], url)
        }

        // ── 4. Generic URL via Jina Reader ──
        return await fetchViaJina(url)
    } catch (err: any) {
        return fail(err?.message || 'Unknown error')
    }
}

/**
 * 批量抓取多个 PoW URL
 */
export async function parseAllPoWs(urls: string[]): Promise<PoWResult[]> {
    return Promise.all(urls.map(parsePoWUrl))
}

// ─────────────────────────────────────────────
// GitHub fetchers
// ─────────────────────────────────────────────

function githubHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SuperGuild-Oracle/1.0',
    }
    const token = process.env.GITHUB_TOKEN
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    return headers
}

async function fetchGitHubPR(
    owner: string,
    repo: string,
    prNumber: number,
    originalUrl: string
): Promise<PoWResult> {
    const headers = githubHeaders()

    // Fetch PR metadata
    const prRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        { headers }
    )
    if (!prRes.ok) {
        return { url: originalUrl, success: false, content: `GitHub API 错误: ${prRes.status}`, source: 'failed', charCount: 0 }
    }
    const pr = await prRes.json()

    // Fetch diff (limited to first 100KB)
    const diffRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        { headers: { ...headers, Accept: 'application/vnd.github.v3.diff' } }
    )
    const diff = diffRes.ok ? (await diffRes.text()).slice(0, 100_000) : '[Diff too large or unavailable]'

    const content = `# GitHub Pull Request: ${pr.title}

**Repo**: ${owner}/${repo}
**PR #${prNumber}** by ${pr.user?.login || 'unknown'}
**Status**: ${pr.state} | **Merged**: ${pr.merged ? 'Yes' : 'No'}
**Commits**: ${pr.commits} | **Files Changed**: ${pr.changed_files}
**Additions**: +${pr.additions} | **Deletions**: -${pr.deletions}

## Description
${pr.body || '(no description)'}

## Diff (truncated)
\`\`\`diff
${diff.slice(0, 50_000)}
\`\`\`
`

    return { url: originalUrl, success: true, content, source: 'github-pr', charCount: content.length }
}

async function fetchGitHubCommit(
    owner: string,
    repo: string,
    sha: string,
    originalUrl: string
): Promise<PoWResult> {
    const headers = githubHeaders()
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
        { headers }
    )
    if (!res.ok) {
        return { url: originalUrl, success: false, content: `GitHub API 错误: ${res.status}`, source: 'failed', charCount: 0 }
    }
    const commit = await res.json()

    const files = (commit.files || [])
        .slice(0, 30)
        .map((f: any) => `- ${f.filename} (+${f.additions}/-${f.deletions})`)
        .join('\n')

    const content = `# GitHub Commit: ${commit.commit?.message || sha}

**Repo**: ${owner}/${repo}
**Author**: ${commit.commit?.author?.name || 'unknown'}
**Date**: ${commit.commit?.author?.date || 'unknown'}
**Stats**: +${commit.stats?.additions || 0} / -${commit.stats?.deletions || 0}

## Files Changed
${files}
`

    return { url: originalUrl, success: true, content, source: 'github-pr', charCount: content.length }
}

async function fetchGitHubRepo(
    owner: string,
    repo: string,
    originalUrl: string
): Promise<PoWResult> {
    const headers = githubHeaders()

    // Fetch repo info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    if (!repoRes.ok) {
        return { url: originalUrl, success: false, content: `GitHub API 错误: ${repoRes.status}`, source: 'failed', charCount: 0 }
    }
    const repoData = await repoRes.json()

    // Fetch README
    let readme = '(no README found)'
    try {
        const readmeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            { headers: { ...headers, Accept: 'application/vnd.github.v3.raw' } }
        )
        if (readmeRes.ok) {
            readme = (await readmeRes.text()).slice(0, 30_000)
        }
    } catch { /* ignore */ }

    // Fetch recent commits
    const commitsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
        { headers }
    )
    const commits = commitsRes.ok ? await commitsRes.json() : []
    const commitList = commits
        .map((c: any) => `- ${c.sha?.slice(0, 7)} ${c.commit?.message?.split('\n')[0] || ''}`)
        .join('\n')

    const content = `# GitHub Repository: ${owner}/${repo}

**Description**: ${repoData.description || 'N/A'}
**Language**: ${repoData.language || 'N/A'}
**Stars**: ${repoData.stargazers_count} | **Forks**: ${repoData.forks_count}

## README (truncated)
${readme.slice(0, 20_000)}

## Recent Commits
${commitList}
`

    return { url: originalUrl, success: true, content, source: 'github-repo', charCount: content.length }
}

// ─────────────────────────────────────────────
// Jina Reader (generic URL → Markdown)
// ─────────────────────────────────────────────

async function fetchViaJina(url: string): Promise<PoWResult> {
    const jinaKey = process.env.JINA_API_KEY
    const headers: Record<string, string> = {
        Accept: 'application/json',
    }
    if (jinaKey) {
        headers['Authorization'] = `Bearer ${jinaKey}`
    }

    const res = await fetch(`https://r.jina.ai/${url}`, {
        headers,
        signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
        // Fallback: try raw fetch
        return await fetchRawText(url)
    }

    const data = await res.json()
    const content = (data.data?.content || data.content || '').slice(0, 50_000)

    if (!content || content.length < 50) {
        return await fetchRawText(url)
    }

    return {
        url,
        success: true,
        content: `# Content from: ${data.data?.title || url}\n\n${content}`,
        source: 'jina',
        charCount: content.length,
    }
}

async function fetchRawText(url: string): Promise<PoWResult> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
        if (!res.ok) {
            return { url, success: false, content: `HTTP ${res.status}`, source: 'failed', charCount: 0 }
        }
        const text = (await res.text()).slice(0, 30_000)
        return { url, success: true, content: text, source: 'raw-text', charCount: text.length }
    } catch {
        return { url, success: false, content: '抓取超时或网络错误', source: 'failed', charCount: 0 }
    }
}
