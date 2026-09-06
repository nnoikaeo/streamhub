/**
 * Tests for app/utils/embedZoom.ts
 *
 * The two embed types need opposite formulas, and getting one wrong is a subtle
 * visual bug rather than an error: a sheet given Looker's formula still renders,
 * just narrower than its pane with empty space beside it.
 *
 * The difference is that a Looker report rescales itself to whatever width its
 * iframe has, while a Sheet's grid is a fixed pixel layout that does not reflow.
 */

import { describe, it, expect } from 'vitest'
import { getEmbedZoomStyle } from '../../app/utils/embedZoom'

describe('getEmbedZoomStyle', () => {
  it('applies nothing at 100% — the stylesheet already fills the pane', () => {
    expect(getEmbedZoomStyle(1, 'looker')).toEqual({})
    expect(getEmbedZoomStyle(1, 'sheet')).toEqual({})
  })

  describe('looker', () => {
    it('grows height only, then scales down — the report keeps the same width and shows more rows', () => {
      expect(getEmbedZoomStyle(0.5, 'looker')).toEqual({
        height: '200%',
        transform: 'scale(0.5)',
        left: '25%',
      })
    })

    it('does not touch width — an evenly scaled report just redraws at the same apparent size', () => {
      expect(getEmbedZoomStyle(0.8, 'looker')).not.toHaveProperty('width')
    })

    it('re-centres the narrower result inside the pane', () => {
      // scale(0.8) leaves 20% of the width empty; half of it goes on each side.
      // Parsed rather than string-matched — the arithmetic lands on 9.99…%, and
      // pinning that literal would test the float, not the centring.
      expect(parseFloat(String(getEmbedZoomStyle(0.8, 'looker').left))).toBeCloseTo(10)
    })

    it('treats a dashboard with no type as looker — every row predating Sheets', () => {
      expect(getEmbedZoomStyle(0.5, undefined)).toEqual(getEmbedZoomStyle(0.5, 'looker'))
    })
  })

  describe('sheet', () => {
    it('grows both axes, then scales down — a fixed grid reveals more rows and columns', () => {
      expect(getEmbedZoomStyle(0.5, 'sheet')).toEqual({
        width: '200%',
        height: '200%',
        transform: 'scale(0.5)',
      })
    })

    it('applies no left correction — scaling from the stylesheet origin stays flush with the pane', () => {
      // Looker's `left` here would push the sheet off-centre rather than
      // centring it, because the grown width already fills the pane.
      expect(getEmbedZoomStyle(0.6, 'sheet')).not.toHaveProperty('left')
    })

    it('keeps the box square with the scale at every step', () => {
      for (const zoom of [0.4, 0.6, 0.7, 0.9]) {
        const style = getEmbedZoomStyle(zoom, 'sheet')
        expect(style.width).toBe(style.height)
        expect(style.width).toBe(`${100 / zoom}%`)
      }
    })
  })
})
