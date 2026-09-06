/**
 * Zoom geometry for the dashboard embed iframe.
 *
 * Extracted from the view page because the two embed types need opposite
 * formulas, and a wrong one is a subtle visual bug rather than an error.
 *
 * A Looker report rescales itself to fit whatever width its iframe has, so
 * scaling both axes evenly changes nothing on screen — the report just redraws
 * at the new size. Making the iframe proportionally taller and then scaling the
 * whole thing down leaves the width the report sees unchanged, so the extra
 * height turns into more visible rows. `left` re-centres the narrower result.
 *
 * A Google Sheet does not reflow: its grid is a fixed pixel layout. Given the
 * Looker formula it keeps its own width, gets scaled down, and ends up narrower
 * than the pane with a band of empty space beside it. It needs the plain thing
 * — scale both axes, grow the box to match — so zooming out reveals more rows
 * and more columns.
 *
 * The stylesheet already sets `transform-origin: top left` and `left: 0`, so
 * the sheet case needs no correction of its own.
 */

import type { CSSProperties } from 'vue'
import type { DashboardType } from '~/types/dashboard'

/** `CSSProperties` rather than a hand-written shape, so it binds to `:style`. */
export function getEmbedZoomStyle(zoom: number, type: DashboardType | undefined): CSSProperties {
  if (zoom === 1) return {}

  if (type === 'sheet') {
    return {
      width: `${100 / zoom}%`,
      height: `${100 / zoom}%`,
      transform: `scale(${zoom})`,
    }
  }

  // Undefined type means looker — every dashboard predating Sheets support.
  return {
    height: `${100 / zoom}%`,
    transform: `scale(${zoom})`,
    left: `${(1 - zoom) * 50}%`,
  }
}
