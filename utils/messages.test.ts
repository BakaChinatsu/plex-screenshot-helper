import { describe, expect, it } from 'vitest'
import { captureFailureMessage, clipboardMessage } from './messages'

describe('captureFailureMessage', () => {
  // 这些 reason 由 utils/index.ts 的注入脚本产生，任何一个漏掉文案都会让用户看到空提示
  const REASONS = ['no-video', 'no-canvas-context', 'tainted', 'no-frame', 'encode-failed', 'inject-failed']

  it('has a distinct, non-empty message for every failure the capture path can produce', () => {
    const messages = REASONS.map(reason => captureFailureMessage(reason))
    expect(messages.filter(m => m.length > 0)).toHaveLength(REASONS.length)
    expect(new Set(messages).size).toBe(REASONS.length)
  })

  it('explains that a tainted canvas usually means DRM or a cross-origin source', () => {
    expect(captureFailureMessage('tainted')).toContain('DRM')
  })

  it('appends the underlying error detail when there is one', () => {
    expect(captureFailureMessage('tainted', 'SecurityError')).toContain('SecurityError')
  })

  it('falls back to a generic message for an unrecognised reason', () => {
    expect(captureFailureMessage('something-new')).toContain('截图失败')
  })
})

describe('clipboardMessage', () => {
  it('stays silent when the user did not ask for a clipboard copy', () => {
    expect(clipboardMessage('skipped')).toBeNull()
  })

  it('confirms a successful copy', () => {
    expect(clipboardMessage('ok')).toBe('截图已复制到剪贴板')
  })

  it('mentions permissions when the copy was denied', () => {
    expect(clipboardMessage('denied')).toContain('权限')
  })

  it('mentions HTTPS when the browser has no clipboard API available', () => {
    expect(clipboardMessage('unsupported')).toContain('HTTPS')
  })

  it('surfaces the underlying error detail on failure', () => {
    expect(clipboardMessage('error', 'Document is not focused')).toContain('Document is not focused')
  })
})
