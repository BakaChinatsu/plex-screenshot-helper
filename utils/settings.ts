export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export type ImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

export interface Settings {
  copyToClipboard: boolean
  imageType: ImageType
  imageQuality: number
}

/** 质量为 0 的 JPEG/WEBP 基本没法看，所以下限留一点余量。 */
export const MIN_IMAGE_QUALITY = 0.1
export const MAX_IMAGE_QUALITY = 1

/** 唯一的默认值来源：popup 和截图逻辑都从这里取，避免两边显示与实际不一致。 */
export const DEFAULT_SETTINGS: Settings = {
  copyToClipboard: false,
  imageType: 'image/png',
  imageQuality: 0.95,
}

/** 把 storage 里可能是任意形状的值收敛成一份可用的设置。 */
export function normalizeSettings(raw: Record<string, unknown>): Settings {
  const imageType = (SUPPORTED_IMAGE_TYPES as readonly unknown[]).includes(raw.imageType)
    ? raw.imageType as ImageType
    : DEFAULT_SETTINGS.imageType

  // storage.getItem 在键缺失时返回 null，而 Number(null) === 0 会被钳成下限，
  // 所以空值必须先挡掉再转数字。
  const rawQuality = raw.imageQuality
  const isBlank = rawQuality === null || rawQuality === undefined || rawQuality === ''
  const quality = isBlank ? Number.NaN : Number(rawQuality)
  const imageQuality = Number.isFinite(quality)
    ? Math.min(MAX_IMAGE_QUALITY, Math.max(MIN_IMAGE_QUALITY, quality))
    : DEFAULT_SETTINGS.imageQuality

  return {
    copyToClipboard: Boolean(raw.copyToClipboard),
    imageType,
    imageQuality,
  }
}

/** 从扩展存储读取设置；所有取值/兜底逻辑都在 normalizeSettings 里。 */
export async function loadSettings(): Promise<Settings> {
  const [copyToClipboard, imageType, imageQuality] = await Promise.all([
    storage.getItem('local:copyToClipboard'),
    storage.getItem('local:imageType'),
    storage.getItem('local:imageQuality'),
  ])
  return normalizeSettings({ copyToClipboard, imageType, imageQuality })
}
