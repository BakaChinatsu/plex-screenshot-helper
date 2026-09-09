import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normalizeSettings } from './settings'

describe('normalizeSettings', () => {
  it('fills in every default when storage is empty', () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid stored values untouched', () => {
    expect(normalizeSettings({
      copyToClipboard: true,
      imageType: 'image/webp',
      imageQuality: 0.6,
    })).toEqual({ copyToClipboard: true, imageType: 'image/webp', imageQuality: 0.6 })
  })

  it('falls back to png for an unsupported image type', () => {
    expect(normalizeSettings({ imageType: 'image/avif' }).imageType).toBe('image/png')
  })

  it('coerces a quality stored as a string', () => {
    expect(normalizeSettings({ imageQuality: '0.5' }).imageQuality).toBe(0.5)
  })

  it('clamps quality above the maximum', () => {
    expect(normalizeSettings({ imageQuality: 5 }).imageQuality).toBe(1)
  })

  it('clamps quality below the minimum instead of producing an unusable image', () => {
    expect(normalizeSettings({ imageQuality: 0 }).imageQuality).toBe(0.1)
  })

  it('falls back to the default quality when the stored value is not a number', () => {
    expect(normalizeSettings({ imageQuality: 'abc' }).imageQuality).toBe(DEFAULT_SETTINGS.imageQuality)
  })

  it('uses the default quality when storage returns null for a missing key', () => {
    expect(normalizeSettings({ imageQuality: null }).imageQuality).toBe(DEFAULT_SETTINGS.imageQuality)
  })

  it('uses the default image type when storage returns null for a missing key', () => {
    expect(normalizeSettings({ imageType: null }).imageType).toBe(DEFAULT_SETTINGS.imageType)
  })

  it('coerces a truthy non-boolean clipboard flag to a real boolean', () => {
    expect(normalizeSettings({ copyToClipboard: 'true' }).copyToClipboard).toBe(true)
  })
})
