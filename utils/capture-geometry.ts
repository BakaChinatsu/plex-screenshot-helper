export interface VideoLayout {
  left: number
  top: number
  width: number
  height: number
  videoWidth: number
  videoHeight: number
  viewportWidth: number
  viewportHeight: number
  objectFit: string
  objectPosition: string
}

export interface CaptureCrop {
  x: number
  y: number
  width: number
  height: number
}

function positionOffset(value: string, space: number): number {
  const keywords: Record<string, number> = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 }
  // 用 hasOwn 而不是 in：`in` 会命中 Object.prototype 上的属性，
  // 例如 'constructor'，那样会算出 NaN 并一路传播成无效的裁剪区域。
  if (Object.hasOwn(keywords, value))
    return space * keywords[value]
  if (/^-?[\d.]+%$/.test(value))
    return space * Number.parseFloat(value) / 100
  if (/^-?[\d.]+px$/.test(value))
    return Number.parseFloat(value)
  if (value === '0')
    return 0
  throw new Error('This player uses an unsupported object-position.')
}

export function getCaptureCrop(layout: VideoLayout, imageWidth: number, imageHeight: number): CaptureCrop {
  const dimensions = [
    layout.width,
    layout.height,
    layout.videoWidth,
    layout.videoHeight,
    layout.viewportWidth,
    layout.viewportHeight,
    imageWidth,
    imageHeight,
  ]
  if (dimensions.some(value => !Number.isFinite(value) || value <= 0)
    || !Number.isFinite(layout.left) || !Number.isFinite(layout.top)) {
    throw new Error('The player has no visible capture area.')
  }

  let width = layout.width
  let height = layout.height
  if (layout.objectFit !== 'fill') {
    const contain = Math.min(width / layout.videoWidth, height / layout.videoHeight)
    const scales: Record<string, number> = {
      'contain': contain,
      'cover': Math.max(width / layout.videoWidth, height / layout.videoHeight),
      'none': 1,
      'scale-down': Math.min(1, contain),
    }
    const scale = scales[layout.objectFit]
    if (scale === undefined)
      throw new Error('This player uses an unsupported object-fit.')
    width = layout.videoWidth * scale
    height = layout.videoHeight * scale
  }

  const position = layout.objectPosition.trim().split(/\s+/)
  if (position.length > 2)
    throw new Error('This player uses an unsupported object-position.')
  let [horizontal = '50%', vertical = '50%'] = position
  if (horizontal === 'top' || horizontal === 'bottom')
    [horizontal, vertical] = [position[1] || '50%', horizontal]
  const left = layout.left + positionOffset(horizontal, layout.width - width)
  const top = layout.top + positionOffset(vertical, layout.height - height)

  const visibleLeft = Math.max(0, layout.left, left)
  const visibleTop = Math.max(0, layout.top, top)
  const visibleRight = Math.min(layout.viewportWidth, layout.left + layout.width, left + width)
  const visibleBottom = Math.min(layout.viewportHeight, layout.top + layout.height, top + height)
  if (visibleRight <= visibleLeft || visibleBottom <= visibleTop)
    throw new Error('Scroll the video into view before capturing it.')

  const scaleX = imageWidth / layout.viewportWidth
  const scaleY = imageHeight / layout.viewportHeight
  const x = Math.max(0, Math.floor(visibleLeft * scaleX))
  const y = Math.max(0, Math.floor(visibleTop * scaleY))
  const right = Math.min(imageWidth, Math.ceil(visibleRight * scaleX))
  const bottom = Math.min(imageHeight, Math.ceil(visibleBottom * scaleY))

  return {
    x,
    y,
    width: right - x,
    height: bottom - y,
  }
}
