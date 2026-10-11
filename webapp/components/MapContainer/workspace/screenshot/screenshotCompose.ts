import {
  computeOverlayLayout,
  OVERLAY_STYLE,
  type OverlayLayout,
  type OverlayRect,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotLayout'

/**
 * Draws the scale bar as a "|____|" bracket.
 * @param {CanvasRenderingContext2D} context - The canvas context.
 * @param {object} bar - The bar position (y is the middle of the first strip line).
 * @returns {void}
 */
const drawScaleBar = (context: CanvasRenderingContext2D, bar: { x: number; y: number; widthPx: number }): void => {
  const { x, y, widthPx } = bar
  context.strokeStyle = OVERLAY_STYLE.textColor
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(x, y - 5)
  context.lineTo(x, y + 4)
  context.lineTo(x + widthPx, y + 4)
  context.lineTo(x + widthPx, y - 5)
  context.stroke()
}

/**
 * Draws the north arrow: an arrow head and an "N" on a light box.
 * @param {CanvasRenderingContext2D} context - The canvas context.
 * @param {OverlayRect} rect - The box.
 * @returns {void}
 */
const drawNorthArrow = (context: CanvasRenderingContext2D, rect: OverlayRect): void => {
  const { x, y, width, height } = rect
  const centerX = x + width / 2
  context.fillStyle = OVERLAY_STYLE.stripColor
  context.fillRect(x, y, width, height)
  context.fillStyle = OVERLAY_STYLE.textColor
  context.beginPath()
  context.moveTo(centerX, y + 4)
  context.lineTo(centerX + 7, y + 21)
  context.lineTo(centerX, y + 17)
  context.lineTo(centerX - 7, y + 21)
  context.closePath()
  context.fill()
  context.font = OVERLAY_STYLE.fontBold
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('N', centerX, y + 28)
}

/**
 * Draws a computed overlay layout.
 * @param {CanvasRenderingContext2D} context - The canvas context.
 * @param {OverlayLayout} layout - The layout.
 * @returns {void}
 */
const drawLayout = (context: CanvasRenderingContext2D, layout: OverlayLayout): void => {
  if (layout.strip) {
    context.fillStyle = OVERLAY_STYLE.stripColor
    context.fillRect(layout.strip.x, layout.strip.y, layout.strip.width, layout.strip.height)
  }
  if (layout.scaleBar) drawScaleBar(context, layout.scaleBar)
  if (layout.northArrow) drawNorthArrow(context, layout.northArrow)
  context.fillStyle = OVERLAY_STYLE.textColor
  context.textBaseline = 'middle'
  for (const text of layout.texts) {
    context.font = text.font
    context.textAlign = text.align
    context.fillText(text.text, text.x, text.y, text.maxWidth)
  }
}

/**
 * Draws the scale bar, north arrow and stamp over a captured map.
 * @param {object} params - The parameters.
 * @param {HTMLCanvasElement} params.source - The captured map.
 * @param {boolean} params.includeScale - Whether to draw the scale bar and the north arrow.
 * @param {boolean} params.includeStamp - Whether to draw the stamp.
 * @param {object|null} params.scaleBar - Scale bar width and label (null: unknown scale).
 * @param {Array<string>} params.leftLines - Stamp lines on the left.
 * @param {Array<string>} params.rightLines - Stamp lines on the right.
 * @returns {HTMLCanvasElement} A new canvas with the overlay (the source when 2D is not available).
 */
export const composeScreenshot = ({
  source,
  includeScale,
  includeStamp,
  scaleBar,
  leftLines,
  rightLines,
}: {
  source: HTMLCanvasElement
  includeScale: boolean
  includeStamp: boolean
  scaleBar: { widthPx: number; label: string } | null
  leftLines: string[]
  rightLines: string[]
}): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const context = canvas.getContext('2d')
  if (!context) return source
  context.drawImage(source, 0, 0)
  const layout = computeOverlayLayout({
    width: canvas.width,
    height: canvas.height,
    includeScale,
    includeStamp,
    scaleBar,
    leftLines,
    rightLines,
    measure: (text, font) => {
      context.font = font
      return context.measureText(text).width
    },
  })
  drawLayout(context, layout)
  return canvas
}

/**
 * Encodes a canvas as a PNG blob.
 * @param {HTMLCanvasElement} canvas - The canvas.
 * @returns {Promise<Blob>} The PNG.
 */
export const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The PNG could not be encoded'))), 'image/png')
  })
