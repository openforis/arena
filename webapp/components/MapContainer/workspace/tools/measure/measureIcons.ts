// the mockup's quick button icon, in the toolbar text colour (an <img> cannot use currentColor)
const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f3138"' +
  ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'

// a measuring stick (Measure distance); it replaces the PNG of the removed plugin
const MEASURE_DISTANCE_SVG = [
  SVG_OPEN,
  '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2"/><path d="m10 10 2 2"/><path d="m13 7 2 2"/>',
  '</svg>',
].join('')

/**
 * Turns an SVG document into an image URL.
 * @param {string} svg - The SVG markup.
 * @returns {string} The data URI.
 */
const toSvgDataUri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`

export const measureDistanceIconSrc = toSvgDataUri(MEASURE_DISTANCE_SVG)
