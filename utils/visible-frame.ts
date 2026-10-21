import type { CaptureCrop, VideoLayout } from './capture-geometry'
import { getCaptureCrop } from './capture-geometry'

interface VisibleFrameProbe {
  currentTime: number
  source: string
  bounds: { left: number, top: number, width: number, height: number }
  layout: VideoLayout
  /** 截图前的播放状态，用来在截完之后把视频恢复原样。 */
  wasPlaying: boolean
}

export async function captureVisibleFrame(
  tabId: number,
  videoKey: string,
  frameKey: string,
  documentId?: string,
): Promise<number> {
  const target = documentId ? { tabId, documentIds: [documentId] } : { tabId }
  const tab = await browser.tabs.get(tabId)
  if (!tab.active)
    throw new Error('Keep the video tab active while capturing.')

  const [probe] = await browser.scripting.executeScript({
    target,
    func: async (videoKey: string): Promise<VisibleFrameProbe> => {
      const store = globalThis as unknown as Record<string, unknown>
      const video = store[videoKey] as HTMLVideoElement
      if (!video?.isConnected || !video.mediaKeys)
        throw new Error('The selected video changed. Please try again.')
      if (window.visualViewport && window.visualViewport.scale !== 1)
        throw new Error('Reset pinch zoom before capturing the video.')

      // 暂停是为了让画面静止下来，截完必须恢复，所以先记下原本的状态。
      const wasPlaying = !video.paused
      video.pause()
      document.querySelector('#plex-screenshot-helper-toast')?.remove()
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 250)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          clearTimeout(timeout)
          resolve()
        }))
      })

      const rect = video.getBoundingClientRect()
      const style = getComputedStyle(video)
      if (style.visibility !== 'visible' || style.opacity === '0')
        throw new Error('Scroll the selected video into view before capturing it.')

      const scaleX = video.offsetWidth ? rect.width / video.offsetWidth : 1
      const scaleY = video.offsetHeight ? rect.height / video.offsetHeight : 1
      const left = Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft)
      const top = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.paddingTop)
      const right = Number.parseFloat(style.borderRightWidth) + Number.parseFloat(style.paddingRight)
      const bottom = Number.parseFloat(style.borderBottomWidth) + Number.parseFloat(style.paddingBottom)
      return {
        currentTime: video.currentTime,
        source: video.currentSrc,
        bounds: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        layout: {
          left: rect.left + left * scaleX,
          top: rect.top + top * scaleY,
          width: rect.width - (left + right) * scaleX,
          height: rect.height - (top + bottom) * scaleY,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
        },
        wasPlaying,
      }
    },
    args: [videoKey],
  })
  if (!probe?.result)
    throw new Error('Could not inspect the video on this page.')
  const { currentTime, layout } = probe.result

  // 只比较标签页，不比较 URL。captureVisibleTab 截的是当前活动标签，
  // 所以必须确认用户没有切走。而 URL 在 Plex 这类 SPA 里会随路由变化，
  // 拿它做判断会误报；页面真的换掉时，下面那次注入的
  // isConnected / currentSrc / currentTime 校验会拦住。
  async function checkActiveTab() {
    const [active] = await browser.tabs.query({ active: true, windowId: tab.windowId })
    if (active?.id !== tabId)
      throw new Error('The active page changed. Return to the video and try again.')
  }
  await checkActiveTab()
  // https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab
  const screenshot = await browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' })
  await checkActiveTab()

  const bitmap = await createImageBitmap(await (await fetch(screenshot)).blob())
  const crop = getCaptureCrop(layout, bitmap.width, bitmap.height)
  bitmap.close()

  const [frame] = await browser.scripting.executeScript({
    target,
    func: async (videoKey: string, frameKey: string, screenshot: string, crop: CaptureCrop, before: VisibleFrameProbe) => {
      const store = globalThis as unknown as Record<string, unknown>
      const video = store[videoKey] as HTMLVideoElement
      delete store[videoKey]

      try {
        if (!video?.isConnected || !video.paused || video.seeking
          || video.currentSrc !== before.source || video.currentTime !== before.currentTime) {
          throw new Error('The video changed while capturing. Please try again.')
        }

        const rect = video.getBoundingClientRect()
        const style = getComputedStyle(video)
        if (rect.left !== before.bounds.left || rect.top !== before.bounds.top
          || rect.width !== before.bounds.width || rect.height !== before.bounds.height
          || innerWidth !== before.layout.viewportWidth || innerHeight !== before.layout.viewportHeight
          || style.objectFit !== before.layout.objectFit || style.objectPosition !== before.layout.objectPosition
          || (window.visualViewport && window.visualViewport.scale !== 1)) {
          throw new Error('The video position changed while capturing. Please try again.')
        }

        const bitmap = await createImageBitmap(await (await fetch(screenshot)).blob())
        const canvas = document.createElement('canvas')
        canvas.width = crop.width
        canvas.height = crop.height
        const context = canvas.getContext('2d')
        if (!context)
          throw new Error('Could not create the screenshot canvas.')
        context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
        bitmap.close()
        store[frameKey] = canvas
        return true
      }
      finally {
        // 恢复播放排在所有校验和裁剪之后。提前恢复会让 currentTime 继续前进，
        // 上面依赖它的校验就会误判成「截图期间视频变了」。
        // 放在 finally 里是为了让失败路径也能恢复，否则截图失败还要留下一个停住的播放器。
        if (before.wasPlaying && video?.isConnected)
          void video.play().catch(() => {})
      }
    },
    args: [videoKey, frameKey, screenshot, crop, probe.result],
  })
  if (!frame?.result)
    throw new Error('Could not prepare the captured frame.')
  return currentTime
}
