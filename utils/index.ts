import type { VideoMetadata } from './filename'
import type { Settings } from './settings'
import { buildFilename, extensionForImageType } from './filename'
import { captureFailureMessage, clipboardMessage } from './messages'
import { loadSettings } from './settings'

/**
 * 两次注入之间用来暂存已截画面的全局键，挂在扩展自己的 isolated world 上，
 * 页面脚本看不到，也不会和页面变量冲突。
 */
const FRAME_KEY = '__plexScreenshotHelperFrame'

type ProbeResult
  = | { ok: true, meta: VideoMetadata }
    | { ok: false, reason: string, detail?: string }

type EmitResult
  = | { ok: true, clipboard: string, detail?: string }
    | { ok: false, reason: string, detail?: string }

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  return tab?.id
}

/**
 * 在页面上弹一条 toast。所有面向用户的提示都走这里，
 * 页面里因此只需要一份 toast 实现。
 */
export async function notify(tabId: number, message: string): Promise<void> {
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      func: (text: string) => {
        document.querySelector('#plex-screenshot-helper-toast')?.remove()

        const toast = document.createElement('div')
        toast.id = 'plex-screenshot-helper-toast'
        toast.textContent = text
        toast.style.cssText = [
          'position:fixed',
          'top:32px',
          'left:50%',
          'transform:translateX(-50%)',
          'max-width:80vw',
          'background:#323232',
          'color:#fff',
          'padding:12px 24px',
          'border-radius:6px',
          'font-size:16px',
          'line-height:1.5',
          'z-index:2147483647',
          'box-shadow:0 2px 8px rgba(0,0,0,0.2)',
          'opacity:0',
          'transition:opacity 0.3s',
          'pointer-events:none',
        ].join(';')

        // 全屏播放时 body 下的固定定位元素不可见，必须挂到全屏元素里
        const host = document.fullscreenElement ?? document.body
        host.appendChild(toast)

        setTimeout(() => {
          toast.style.opacity = '1'
        }, 10)
        setTimeout(() => {
          toast.style.opacity = '0'
          setTimeout(() => toast.remove(), 300)
        }, 3000)
      },
      args: [message],
    })
  }
  catch {
    // 浏览器内置页面不允许注入，这种情况下没法提示，静默即可
  }
}

/**
 * 一次注入内完成「找播放器 + 读取信息 +（可选）抓取画面」。
 * 时间戳和画面来自同一次注入，两者必然对得上。
 */
async function probePage(tabId: number, grabFrame: boolean): Promise<ProbeResult> {
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: (frameKey: string, shouldGrab: boolean) => {
        function pickVideo(): HTMLVideoElement | null {
          const candidates = Array.from(document.querySelectorAll('video'))

          // mux player 把 video 藏在两层 shadow DOM 里
          const muxVideo = document
            .querySelector('mux-player')
            ?.shadowRoot
            ?.querySelector('mux-video')
            ?.shadowRoot
            ?.querySelector('video')
          if (muxVideo)
            candidates.push(muxVideo)

          const usable = candidates.filter(v => v.videoWidth > 0 && v.videoHeight > 0)
          if (usable.length === 0)
            return null

          // 页面上可能同时有广告或预览视频：优先正在播放的，再取画面最大的
          const playing = usable.filter(v => !v.paused && !v.ended)
          const pool = playing.length > 0 ? playing : usable
          return pool.reduce((best, video) =>
            video.videoWidth * video.videoHeight > best.videoWidth * best.videoHeight ? video : best)
        }

        const video = pickVideo()
        if (!video)
          return { ok: false as const, reason: 'no-video' }

        // Plex 的类名带 CSS Modules 哈希后缀，只能用前缀匹配
        const plex = document.querySelector<HTMLElement>('[class^="PlayerControlsMetadata-container"]')
        const meta = {
          title: plex?.querySelector('a')?.title || document.title || '',
          episode: plex?.querySelector<HTMLElement>('[class*="isSecondary"]')?.textContent?.trim() || '',
          currentTime: video.currentTime,
        }

        if (!shouldGrab)
          return { ok: true as const, meta }

        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const context = canvas.getContext('2d')
          if (!context)
            return { ok: false as const, reason: 'no-canvas-context' }

          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // 立刻读一个像素：跨域视频或 DRM 造成的画布污染会在这里抛 SecurityError，
          // 而不是等到 toBlob 的异步回调里悄无声息地失败
          context.getImageData(0, 0, 1, 1)

          const store = globalThis as unknown as Record<string, unknown>
          store[frameKey] = canvas
          return { ok: true as const, meta }
        }
        catch (e) {
          return {
            ok: false as const,
            reason: 'tainted',
            detail: e instanceof Error ? e.message : String(e),
          }
        }
      },
      args: [FRAME_KEY, grabFrame],
    })

    return (injection?.result as ProbeResult | undefined) ?? { ok: false, reason: 'inject-failed' }
  }
  catch (e) {
    return { ok: false, reason: 'inject-failed', detail: describe(e) }
  }
}

/** 把上一步暂存的画面编码、下载，并按设置复制到剪贴板。 */
async function emitFrame(
  tabId: number,
  filename: string,
  settings: Settings,
  isChrome: boolean,
): Promise<EmitResult> {
  const downloadName = `${filename}.${extensionForImageType(settings.imageType)}`

  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: (
        frameKey: string,
        name: string,
        imageType: string,
        imageQuality: number,
        copyToClipboard: boolean,
        chromeLike: boolean,
      ) => {
        const store = globalThis as unknown as Record<string, unknown>
        const canvas = store[frameKey] as HTMLCanvasElement | undefined
        delete store[frameKey]

        if (!canvas)
          return Promise.resolve<EmitResult>({ ok: false, reason: 'no-frame' })

        return new Promise<EmitResult>((resolve) => {
          function copyPngToClipboard() {
            // 剪贴板只可靠地接受 PNG，所以无论下载用什么格式都另导一份 PNG
            canvas!.toBlob(async (pngBlob) => {
              if (!pngBlob) {
                resolve({ ok: true, clipboard: 'error', detail: 'PNG 编码失败' })
                return
              }
              try {
                if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
                  resolve({ ok: true, clipboard: 'unsupported' })
                  return
                }
                if (chromeLike && navigator.permissions) {
                  const status = await navigator.permissions
                    .query({ name: 'clipboard-write' as PermissionName })
                  if (status.state === 'denied') {
                    resolve({ ok: true, clipboard: 'denied' })
                    return
                  }
                }
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })])
                resolve({ ok: true, clipboard: 'ok' })
              }
              catch (e) {
                resolve({
                  ok: true,
                  clipboard: 'error',
                  detail: e instanceof Error ? e.message : String(e),
                })
              }
            }, 'image/png')
          }

          try {
            canvas.toBlob((blob) => {
              if (!blob) {
                resolve({ ok: false, reason: 'encode-failed' })
                return
              }

              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = name
              link.click()

              // 紧跟着 revoke 在 Firefox 下有概率把下载掐断，推迟释放
              setTimeout(() => URL.revokeObjectURL(url), 60_000)

              if (!copyToClipboard) {
                resolve({ ok: true, clipboard: 'skipped' })
                return
              }
              copyPngToClipboard()
            }, imageType, imageQuality)
          }
          catch (e) {
            resolve({
              ok: false,
              reason: 'encode-failed',
              detail: e instanceof Error ? e.message : String(e),
            })
          }
        })
      },
      args: [
        FRAME_KEY,
        downloadName,
        settings.imageType,
        settings.imageQuality,
        settings.copyToClipboard,
        isChrome,
      ],
    })

    return (injection?.result as EmitResult | undefined) ?? { ok: false, reason: 'inject-failed' }
  }
  catch (e) {
    return { ok: false, reason: 'inject-failed', detail: describe(e) }
  }
}

/** 只读取播放信息，供 popup 的「获取播放信息」使用，不会触碰画面。 */
export async function readFilename(
  tabId: number,
): Promise<{ ok: true, filename: string } | { ok: false, message: string }> {
  const probe = await probePage(tabId, false)
  if (!probe.ok)
    return { ok: false, message: captureFailureMessage(probe.reason, probe.detail) }

  return { ok: true, filename: buildFilename(probe.meta) }
}

/** 截图 → 下载 →（可选）复制到剪贴板；过程中的成功/失败都以页面 toast 反馈。 */
export async function captureScreenshot(tabId: number): Promise<boolean> {
  const settings = await loadSettings()

  const probe = await probePage(tabId, true)
  if (!probe.ok) {
    await notify(tabId, captureFailureMessage(probe.reason, probe.detail))
    return false
  }

  const result = await emitFrame(tabId, buildFilename(probe.meta), settings, import.meta.env.CHROME)
  if (!result.ok) {
    await notify(tabId, captureFailureMessage(result.reason, result.detail))
    return false
  }

  const message = clipboardMessage(result.clipboard, result.detail)
  if (message)
    await notify(tabId, message)

  return true
}
