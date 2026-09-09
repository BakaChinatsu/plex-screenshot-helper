/** 把播放进度（秒）格式化为 `HH_MM_SS`，用下划线是因为 `:` 在文件名里不合法。 */
export function formatTimestamp(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}_${m}_${s}`
}

/** Windows / macOS 下不能出现在文件名里的字符。 */
const ILLEGAL_CHARS = /[<>:"/\\|?*]/g
// 控制字符正是这里要剔除的目标
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

/**
 * 把一段文本清理成可以安全放进文件名的片段：
 * 去控制字符 → 非法字符换成 `_` → 折叠重复的 `_` 和空白 → 截断 → 去掉首尾空白和点。
 */
export function sanitizeFilenamePart(part: string, maxLength = 100): string {
  const cleaned = part
    .replace(CONTROL_CHARS, '')
    .replace(ILLEGAL_CHARS, '_')
    .replace(/_{2,}/g, '_')
    .replace(/\s{2,}/g, ' ')

  // 按码点截断，避免把代理对（emoji 等）切成半个字符
  const truncated = Array.from(cleaned).slice(0, maxLength).join('')

  return truncated.trim().replace(/^\.+|\.+$/g, '').trim()
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

/** 由图片 MIME 类型得出下载用的扩展名，未知类型一律按 png 处理。 */
export function extensionForImageType(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? 'png'
}

export interface VideoMetadata {
  title: string
  episode: string
  currentTime: number
}

const FALLBACK_TITLE = '未知作品'
const MAX_TITLE_LENGTH = 100
const MAX_EPISODE_LENGTH = 80

/**
 * 由页面抓到的原始信息组装文件名（不含扩展名）。
 * 缺失的段会被整段省略，不会留下 `[标题] - - - 时间` 这种空档。
 */
export function buildFilename(meta: VideoMetadata): string {
  const title = sanitizeFilenamePart(meta.title ?? '', MAX_TITLE_LENGTH) || FALLBACK_TITLE
  const episode = sanitizeFilenamePart(meta.episode ?? '', MAX_EPISODE_LENGTH)
  const hasEpisode = episode !== '' && episode !== '-'

  return [`[${title}]`, hasEpisode ? episode : '', formatTimestamp(meta.currentTime)]
    .filter(segment => segment !== '')
    .join(' - ')
}
