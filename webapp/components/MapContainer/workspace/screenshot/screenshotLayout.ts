export type TextMeasure = (text: string, font: string) => number

export const OVERLAY_STYLE = {
  padding: 8,
  lineHeight: 16,
  gap: 16,
  labelGap: 6,
  font: '12px sans-serif',
  fontBold: '600 12px sans-serif',
  stripColor: 'rgba(255, 255, 255, 0.92)',
  textColor: '#1f2329',
  ellipsis: '…',
  leftShare: 0.6, // the left text takes at most 60% of the free width when there is right text
  northArrow: { width: 26, height: 34, margin: 10 },
}

export type OverlayRect = { x: number; y: number; width: number; height: number }

export type OverlayText = {
  text: string
  x: number
  y: number // middle of the line
  align: 'left' | 'right'
  font: string
  maxWidth: number
}

export type OverlayLayout = {
  strip: OverlayRect | null
  scaleBar: { x: number; y: number; widthPx: number } | null
  northArrow: OverlayRect | null
  texts: OverlayText[]
}

export type OverlayLayoutInput = {
  width: number
  height: number
  includeScale: boolean
  includeStamp: boolean
  scaleBar: { widthPx: number; label: string } | null
  leftLines: string[]
  rightLines: string[]
  measure: TextMeasure
}

/**
 * Cuts a text with an ellipsis so that it fits a width.
 * @param {object} params - The parameters.
 * @param {string} params.text - The text.
 * @param {number} params.maxWidth - The available width, in px.
 * @param {string} params.font - The canvas font.
 * @param {TextMeasure} params.measure - Measures a text in a font.
 * @returns {string} The text, cut with "…", or an empty string when not even the ellipsis fits.
 */
export const truncateText = ({
  text,
  maxWidth,
  font,
  measure,
}: {
  text: string
  maxWidth: number
  font: string
  measure: TextMeasure
}): string => {
  if (measure(text, font) <= maxWidth) return text
  const { ellipsis } = OVERLAY_STYLE
  if (measure(ellipsis, font) > maxWidth) return ''
  const chars = Array.from(text)
  let low = 0
  let high = chars.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (measure(`${chars.slice(0, middle).join('').trimEnd()}${ellipsis}`, font) <= maxWidth) {
      low = middle
    } else {
      high = middle - 1
    }
  }
  return `${chars.slice(0, low).join('').trimEnd()}${ellipsis}`
}

/**
 * Lays out a column of text lines from the first line of the strip.
 * @param {object} params - The parameters.
 * @param {Array<string>} params.lines - The lines.
 * @param {number} params.x - Left edge (align left) or right edge (align right).
 * @param {number} params.firstLineY - Middle of the first line.
 * @param {number} params.maxWidth - The available width.
 * @param {string} params.align - 'left' or 'right'.
 * @param {boolean} params.boldFirst - Whether the first line is bold.
 * @param {TextMeasure} params.measure - Measures a text in a font.
 * @returns {{texts: Array<OverlayText>, usedWidth: number}} The texts and the widest text width.
 */
const layoutColumn = ({
  lines,
  x,
  firstLineY,
  maxWidth,
  align,
  boldFirst,
  measure,
}: {
  lines: string[]
  x: number
  firstLineY: number
  maxWidth: number
  align: 'left' | 'right'
  boldFirst: boolean
  measure: TextMeasure
}): { texts: OverlayText[]; usedWidth: number } => {
  const texts: OverlayText[] = []
  let usedWidth = 0
  for (const [index, line] of lines.entries()) {
    const font = boldFirst && index === 0 ? OVERLAY_STYLE.fontBold : OVERLAY_STYLE.font
    const text = truncateText({ text: line, maxWidth, font, measure })
    if (text) {
      texts.push({ text, x, y: firstLineY + index * OVERLAY_STYLE.lineHeight, align, font, maxWidth })
      usedWidth = Math.max(usedWidth, measure(text, font))
    }
  }
  return { texts, usedWidth }
}

/**
 * Returns the north arrow box (top right).
 * @param {number} width - The image width.
 * @returns {OverlayRect} The box.
 */
const getNorthArrowRect = (width: number): OverlayRect => {
  const { width: arrowWidth, height, margin } = OVERLAY_STYLE.northArrow
  return { x: width - margin - arrowWidth, y: margin, width: arrowWidth, height }
}

/**
 * Computes where the strip, scale bar, north arrow and stamp texts go on the image.
 * @param {OverlayLayoutInput} input - Image size, what to include, the scale bar, the stamp lines and a text measure.
 * @returns {OverlayLayout} The layout, in image px.
 */
export const computeOverlayLayout = (input: OverlayLayoutInput): OverlayLayout => {
  const { width, height, includeScale, includeStamp, scaleBar, leftLines, rightLines, measure } = input
  const { padding, lineHeight, gap, labelGap, font, leftShare } = OVERLAY_STYLE
  const northArrow = includeScale ? getNorthArrowRect(width) : null
  const showScaleBar = includeScale && scaleBar !== null
  const left = includeStamp ? leftLines.filter(Boolean) : []
  const right = includeStamp ? rightLines.filter(Boolean) : []
  const lineCount = Math.max(showScaleBar ? 1 : 0, left.length, right.length)
  if (lineCount === 0) return { strip: null, scaleBar: null, northArrow, texts: [] }

  const stripHeight = padding * 2 + lineCount * lineHeight
  const strip = { x: 0, y: height - stripHeight, width, height: stripHeight }
  const firstLineY = strip.y + padding + lineHeight / 2
  const texts: OverlayText[] = []
  let scaleBarBox: OverlayLayout['scaleBar'] = null
  let leftStart = padding
  if (showScaleBar) {
    const labelX = padding + scaleBar.widthPx + labelGap
    const labelWidth = measure(scaleBar.label, font)
    scaleBarBox = { x: padding, y: firstLineY, widthPx: scaleBar.widthPx }
    texts.push({ text: scaleBar.label, x: labelX, y: firstLineY, align: 'left', font, maxWidth: labelWidth })
    leftStart = labelX + labelWidth + gap
  }
  const available = Math.max(0, width - padding - leftStart)
  const leftMaxWidth = right.length > 0 ? Math.floor(available * leftShare) : available
  const leftColumn = layoutColumn({
    lines: left,
    x: leftStart,
    firstLineY,
    maxWidth: leftMaxWidth,
    align: 'left',
    boldFirst: true,
    measure,
  })
  const rightLimit = leftColumn.texts.length > 0 ? leftStart + leftColumn.usedWidth + gap : leftStart
  const rightColumn = layoutColumn({
    lines: right,
    x: width - padding,
    firstLineY,
    maxWidth: Math.max(0, width - padding - rightLimit),
    align: 'right',
    boldFirst: false,
    measure,
  })
  return { strip, scaleBar: scaleBarBox, northArrow, texts: [...texts, ...leftColumn.texts, ...rightColumn.texts] }
}
