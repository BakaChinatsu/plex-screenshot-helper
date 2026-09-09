/** 注入脚本可能返回的失败原因 → 用户可见的中文提示。 */
const CAPTURE_FAILURE_MESSAGES: Record<string, string> = {
  'no-video': '没有找到可用的视频画面，请确认播放器已经开始播放',
  'no-canvas-context': '无法创建画布，当前页面可能限制了 canvas',
  'tainted': '截图失败：画面受 DRM 保护或视频源跨域，浏览器不允许读取像素',
  'no-frame': '截图数据已失效，请重新触发一次',
  'encode-failed': '图片编码失败，可以试试换一种图片格式',
  'inject-failed': '无法在当前页面执行截图，浏览器内置页面和应用商店页面不允许注入脚本',
}

export function captureFailureMessage(reason: string, detail?: string): string {
  const base = CAPTURE_FAILURE_MESSAGES[reason] ?? '截图失败，请重试'
  return detail ? `${base}（${detail}）` : base
}

/**
 * 剪贴板结果 → 提示文案。返回 null 表示这种情况不需要打扰用户。
 */
export function clipboardMessage(outcome: string, detail?: string): string | null {
  switch (outcome) {
    case 'skipped':
      return null
    case 'ok':
      return '截图已复制到剪贴板'
    case 'denied':
      return '复制失败：剪贴板权限被拒绝，请在站点权限里放行'
    case 'unsupported':
      return '复制失败：当前页面不支持剪贴板写入（需要 HTTPS 环境）'
    default:
      return detail ? `复制失败：${detail}` : '复制失败'
  }
}
