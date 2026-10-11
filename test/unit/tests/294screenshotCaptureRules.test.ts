import {
  createImageFailureCounter,
  getCaptureNotice,
  getFitToPlotZoom,
  isMapAtCaptureView,
  shouldExcludeFromCapture,
  TRANSPARENT_PIXEL,
  waitUntil,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotCaptureRules'

const classList = (...tokens: string[]) => ({ contains: (token: string) => tokens.includes(token) })

const containerChild = (...tokens: string[]) => ({ classList: classList(...tokens), isMapContainerChild: true })

const paneChild = (...tokens: string[]) => ({ classList: classList(...tokens), isMapContainerChild: false })

const createClock = () => {
  let time = 0
  const sleeps: number[] = []
  return {
    now: () => time,
    sleep: async (ms: number): Promise<void> => {
      sleeps.push(ms)
      time += ms
    },
    sleeps,
  }
}

describe('Screenshot capture rules (294)', () => {
  test('fits the plot at zoom 17 at most, lower when the map or the base layer stops earlier', () => {
    expect(getFitToPlotZoom({ mapMaxZoom: 19, baseLayerMaxZoom: 16 })).toBe(16)
    expect(getFitToPlotZoom({ mapMaxZoom: 9, baseLayerMaxZoom: 17 })).toBe(9)
    expect(getFitToPlotZoom({ mapMaxZoom: Infinity, baseLayerMaxZoom: undefined })).toBe(17)
    expect(getFitToPlotZoom({})).toBe(17)
  })

  test('keeps only the map pane of the container: controls, floating tool bars and popups are never captured', () => {
    expect(shouldExcludeFromCapture(containerChild('leaflet-map-pane', 'leaflet-pane'), false)).toBe(false)
    expect(shouldExcludeFromCapture(containerChild('leaflet-control-container'), true)).toBe(true)
    // Part 2's measure bar is an MUI Paper portaled into the map container
    expect(shouldExcludeFromCapture(containerChild('MuiPaper-root', 'MuiPaper-elevation'), true)).toBe(true)
    expect(shouldExcludeFromCapture({ classList: null, isMapContainerChild: true }, true)).toBe(true)
    expect(shouldExcludeFromCapture(paneChild('leaflet-popup-pane', 'leaflet-pane'), true)).toBe(true)
    expect(shouldExcludeFromCapture(paneChild('leaflet-tile-pane', 'leaflet-pane'), false)).toBe(false)
    expect(shouldExcludeFromCapture(paneChild('leaflet-pane'), false)).toBe(false)
    expect(shouldExcludeFromCapture({ classList: null, isMapContainerChild: false }, false)).toBe(false)
  })

  test('drops the marker and vector panes only when markers and measurements are off', () => {
    for (const pane of ['leaflet-overlay-pane', 'leaflet-marker-pane', 'leaflet-shadow-pane', 'leaflet-tooltip-pane']) {
      expect(shouldExcludeFromCapture(paneChild(pane, 'leaflet-pane'), false)).toBe(true)
      expect(shouldExcludeFromCapture(paneChild(pane, 'leaflet-pane'), true)).toBe(false)
    }
  })

  test('waits until the tiles are loaded, then lets them fade in', async () => {
    const clock = createClock()
    let polls = 0
    const ready = await waitUntil({
      predicate: () => {
        polls += 1
        return polls >= 3
      },
      timeoutMs: 1000,
      intervalMs: 100,
      settleMs: 300,
      sleep: clock.sleep,
      now: clock.now,
    })
    expect(ready).toBe(true)
    expect(clock.sleeps).toEqual([100, 100, 300])
  })

  test('gives up after the timeout without the fade wait', async () => {
    const clock = createClock()
    const ready = await waitUntil({
      predicate: () => false,
      timeoutMs: 250,
      intervalMs: 100,
      settleMs: 300,
      sleep: clock.sleep,
      now: clock.now,
    })
    expect(ready).toBe(false)
    expect(clock.sleeps).toEqual([100, 100, 100])
  })

  test('replaces tiles that cannot be fetched with a transparent pixel and counts them', () => {
    const counter = createImageFailureCounter()
    expect(counter.getCount()).toBe(0)
    expect(counter.placeholderImage()).toBe(TRANSPARENT_PIXEL)
    expect(counter.placeholderImage()).toBe(TRANSPARENT_PIXEL)
    expect(counter.getCount()).toBe(2)
    expect(TRANSPARENT_PIXEL.startsWith('data:image/')).toBe(true)
  })

  test('still produces the PNG with a "tiles left out" notice when tiles failed', () => {
    expect(getCaptureNotice({ failedImages: 3, maplibre: false })).toEqual({
      key: 'mapWorkspace.screenshot.notices.tilesMissing',
      params: { count: 3 },
      blocking: false,
    })
    expect(getCaptureNotice({ failedImages: 0, maplibre: false })).toBeNull()
  })

  test('blocks the capture of the Equal Earth (MapLibre) base map', () => {
    expect(getCaptureNotice({ failedImages: 0, maplibre: true })).toEqual({
      key: 'mapWorkspace.screenshot.notices.equalEarth',
      blocking: true,
    })
  })
})

describe('Screenshot capture view restore (294)', () => {
  const set = { lat: 10, lng: 20 }
  test('restores when the map is still at the view the capture set', () => {
    expect(isMapAtCaptureView({ current: { lat: 10 + 1e-8, lng: 20 }, currentZoom: 17, set, setZoom: 17 })).toBe(true)
  })
  test('does not restore after the user panned or zoomed', () => {
    expect(isMapAtCaptureView({ current: { lat: 10.01, lng: 20 }, currentZoom: 17, set, setZoom: 17 })).toBe(false)
    expect(isMapAtCaptureView({ current: set, currentZoom: 15, set, setZoom: 17 })).toBe(false)
  })
})
