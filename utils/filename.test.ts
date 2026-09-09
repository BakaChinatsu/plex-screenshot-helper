import { describe, expect, it } from 'vitest'
import { buildFilename, extensionForImageType, formatTimestamp, sanitizeFilenamePart } from './filename'

describe('formatTimestamp', () => {
  it('formats zero as 00_00_00', () => {
    expect(formatTimestamp(0)).toBe('00_00_00')
  })

  it('pads hours, minutes and seconds to two digits', () => {
    expect(formatTimestamp(3661)).toBe('01_01_01')
  })

  it('floors fractional seconds instead of rounding up', () => {
    expect(formatTimestamp(1116.9)).toBe('00_18_36')
  })

  it('keeps counting hours past 24', () => {
    expect(formatTimestamp(90000)).toBe('25_00_00')
  })

  it('falls back to 00_00_00 for NaN', () => {
    expect(formatTimestamp(Number.NaN)).toBe('00_00_00')
  })

  it('falls back to 00_00_00 for negative input', () => {
    expect(formatTimestamp(-5)).toBe('00_00_00')
  })
})

describe('sanitizeFilenamePart', () => {
  it('leaves ordinary text untouched', () => {
    expect(sanitizeFilenamePart('ガールズバンドクライ')).toBe('ガールズバンドクライ')
  })

  it('replaces every filesystem-illegal character with an underscore', () => {
    expect(sanitizeFilenamePart('a<b>c:d"e/f\\g|h?i*j')).toBe('a_b_c_d_e_f_g_h_i_j')
  })

  it('strips ASCII control characters', () => {
    expect(sanitizeFilenamePart('a\u0000b\u001Fc')).toBe('abc')
  })

  it('collapses underscore runs left behind by replacement', () => {
    expect(sanitizeFilenamePart('S1//E2')).toBe('S1_E2')
  })

  it('collapses whitespace runs into a single space', () => {
    expect(sanitizeFilenamePart('a   b')).toBe('a b')
  })

  it('trims surrounding whitespace and trailing dots', () => {
    expect(sanitizeFilenamePart('  title...  ')).toBe('title')
  })

  it('truncates to the given maximum length', () => {
    expect(sanitizeFilenamePart('あ'.repeat(200), 100)).toHaveLength(100)
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(sanitizeFilenamePart('   ')).toBe('')
  })
})

describe('extensionForImageType', () => {
  it('maps image/png to png', () => {
    expect(extensionForImageType('image/png')).toBe('png')
  })

  it('maps image/jpeg to jpg rather than jpeg', () => {
    expect(extensionForImageType('image/jpeg')).toBe('jpg')
  })

  it('maps image/webp to webp', () => {
    expect(extensionForImageType('image/webp')).toBe('webp')
  })

  it('falls back to png for an unknown mime type', () => {
    expect(extensionForImageType('image/avif')).toBe('png')
  })
})

describe('buildFilename', () => {
  it('joins title, episode and timestamp for a full Plex page', () => {
    expect(buildFilename({
      title: 'ガールズバンドクライ',
      episode: 'シーズン1·第2話—夜行性の生き物3匹',
      currentTime: 1116,
    })).toBe('[ガールズバンドクライ] - シーズン1·第2話—夜行性の生き物3匹 - 00_18_36')
  })

  it('drops the episode segment entirely when there is no episode', () => {
    expect(buildFilename({ title: 'Some Video', episode: '', currentTime: 65 }))
      .toBe('[Some Video] - 00_01_05')
  })

  it('treats a bare hyphen as a missing episode rather than printing it', () => {
    expect(buildFilename({ title: 'Some Video', episode: '-', currentTime: 65 }))
      .toBe('[Some Video] - 00_01_05')
  })

  it('falls back to a placeholder when the title is missing', () => {
    expect(buildFilename({ title: '', episode: '', currentTime: 0 }))
      .toBe('[未知作品] - 00_00_00')
  })

  it('sanitizes illegal characters coming from the page', () => {
    expect(buildFilename({ title: 'AC/DC: Live', episode: 'S1/E2', currentTime: 0 }))
      .toBe('[AC_DC_ Live] - S1_E2 - 00_00_00')
  })

  it('truncates an over-long title', () => {
    expect(buildFilename({ title: 'あ'.repeat(200), episode: '', currentTime: 0 }))
      .toBe(`[${'あ'.repeat(100)}] - 00_00_00`)
  })

  it('falls back to a zero timestamp when currentTime is not a number', () => {
    expect(buildFilename({ title: 'X', episode: '', currentTime: Number.NaN }))
      .toBe('[X] - 00_00_00')
  })
})
