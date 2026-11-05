import {
  computeOverlayLayout,
  OVERLAY_STYLE,
  truncateText,
  type OverlayText,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotLayout'

// deterministic text widths: 7 px per character in bold, 6 px otherwise
const measure = (text: string, font: string): number => Array.from(text).length * (font.startsWith('600') ? 7 : 6)

const textEnd = (text: OverlayText): number => (text.align === 'left' ? text.x + measure(text.text, text.font) : text.x)

const textStart = (text: OverlayText): number =>
  text.align === 'left' ? text.x : text.x - measure(text.text, text.font)

const base = {
  width: 800,
  height: 500,
  includeScale: true,
  includeStamp: true,
  scaleBar: { widthPx: 80, label: '50 m' },
  leftLines: ['Cluster 2 · 2026-10-11', '41.90000, 12.50000'],
  rightLines: ['ESRI World Imagery (satellite)', '© Esri, Maxar'],
  measure,
}

describe('Screenshot overlay layout (291)', () => {
  test('draws nothing when scale and stamp are off', () => {
    expect(computeOverlayLayout({ ...base, includeScale: false, includeStamp: false })).toEqual({
      strip: null,
      scaleBar: null,
      northArrow: null,
      texts: [],
    })
  })

  test('keeps the north arrow without a scale bar (scale unknown)', () => {
    const layout = computeOverlayLayout({ ...base, includeStamp: false, scaleBar: null })
    expect(layout.strip).toBeNull()
    expect(layout.northArrow).toEqual({ x: 800 - 10 - 26, y: 10, width: 26, height: 34 })
  })

  test('puts the scale bar alone in a one-line strip', () => {
    const layout = computeOverlayLayout({ ...base, includeStamp: false })
    expect(layout.strip).toEqual({ x: 0, y: 500 - 32, width: 800, height: 32 })
    expect(layout.scaleBar).toEqual({ x: 8, y: 500 - 32 + 8 + 8, widthPx: 80 })
    expect(layout.texts).toEqual([
      { text: '50 m', x: 8 + 80 + 6, y: 500 - 16, align: 'left', font: OVERLAY_STYLE.font, maxWidth: 24 },
    ])
  })

  test('starts the left text after the scale block and right-aligns the right text', () => {
    const layout = computeOverlayLayout(base)
    expect(layout.strip).toEqual({ x: 0, y: 500 - 48, width: 800, height: 48 })
    const left = layout.texts.filter((text) => text.align === 'left').slice(1)
    const right = layout.texts.filter((text) => text.align === 'right')
    expect(left.map((text) => text.x)).toEqual([94 + 24 + 16, 94 + 24 + 16])
    expect(left[0].font).toBe(OVERLAY_STYLE.fontBold)
    expect(right.map((text) => [text.text, text.x])).toEqual([
      ['ESRI World Imagery (satellite)', 792],
      ['© Esri, Maxar', 792],
    ])
  })

  test('starts the left text at the padding without a scale bar', () => {
    const layout = computeOverlayLayout({ ...base, includeScale: false })
    expect(layout.texts.filter((text) => text.align === 'left').map((text) => text.x)).toEqual([8, 8])
    expect(layout.northArrow).toBeNull()
  })

  test('cuts a long attribution on a narrow map and never overlaps the left text', () => {
    const layout = computeOverlayLayout({
      ...base,
      width: 300,
      rightLines: [
        'ESRI World Imagery (satellite)',
        '© Esri, Maxar, Earthstar Geographics, and the GIS User Community · Contains modified Copernicus Sentinel data 2026',
      ],
    })
    const left = layout.texts.filter((text) => text.align === 'left')
    const right = layout.texts.filter((text) => text.align === 'right')
    const leftEnd = Math.max(...left.map(textEnd))
    expect(right.length).toBeGreaterThan(0)
    expect(right[right.length - 1].text.endsWith('…')).toBe(true)
    for (const text of right) {
      expect(textStart(text)).toBeGreaterThanOrEqual(leftEnd + OVERLAY_STYLE.gap)
      expect(textEnd(text)).toBeLessThanOrEqual(300 - OVERLAY_STYLE.padding)
    }
  })

  test('truncates a text with an ellipsis to the width', () => {
    expect(truncateText({ text: 'abcdef', maxWidth: 36, font: OVERLAY_STYLE.font, measure })).toBe('abcdef')
    expect(truncateText({ text: 'abcdef', maxWidth: 24, font: OVERLAY_STYLE.font, measure })).toBe('abc…')
    expect(truncateText({ text: 'abcdef', maxWidth: 5, font: OVERLAY_STYLE.font, measure })).toBe('')
  })
})
