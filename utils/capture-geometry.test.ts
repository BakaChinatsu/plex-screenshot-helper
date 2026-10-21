import type { VideoLayout } from './capture-geometry'
import { describe, expect, it } from 'vitest'
import { getCaptureCrop } from './capture-geometry'

const layout: VideoLayout = {
  left: 100,
  top: 80,
  width: 800,
  height: 600,
  videoWidth: 1920,
  videoHeight: 1080,
  viewportWidth: 1200,
  viewportHeight: 800,
  objectFit: 'contain',
  objectPosition: '50% 50%',
}

describe('getCaptureCrop', () => {
  it('removes letterboxing and scales to screenshot pixels', () => {
    expect(getCaptureCrop(layout, 2400, 1600)).toEqual({ x: 200, y: 310, width: 1600, height: 900 })
  })

  it('clips the crop to the visible viewport', () => {
    expect(getCaptureCrop({ ...layout, left: -100 }, 1200, 800))
      .toEqual({ x: 0, y: 155, width: 700, height: 450 })
  })

  it('rejects a player outside the viewport', () => {
    expect(() => getCaptureCrop({ ...layout, left: 1400 }, 1200, 800)).toThrow('Scroll')
  })

  it('rejects an object-position that happens to name an Object.prototype property', () => {
    expect(() => getCaptureCrop({ ...layout, objectPosition: 'constructor 50%' }, 1200, 800))
      .toThrow('object-position')
  })
})
