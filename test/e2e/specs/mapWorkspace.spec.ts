import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { openRecord } from '../helpers/records'
import { Urls } from '../helpers/urls'

const ids = TestId.mapWorkspace

// one placemark near the sample records
const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Plot A</name>
<Point><coordinates>12.5,41.9,0</coordinates></Point></Placemark></Document></kml>`

const uploadedRows = (page: Page): Locator =>
  page.locator(`[data-testid^="${TestId.mapWorkspace.overlayRow('uploaded-')}"]`)

// label of the coordinate attribute of the sample survey (its overlay in the layers control)
const COORDINATE_LAYER = 'Cluster coordinate'

const openMap = async (page: Page): Promise<void> => {
  await page.goto(Urls.map)
  await expect(page.getByTestId(ids.toolbar)).toBeVisible()
  await expect(page.getByTestId(ids.menuButton('baseMap'))).toBeVisible()
}

// custom layers: a tile host that never resolves, answered by the route of the test
const CUSTOM_TILE_HOST = 'https://tiles.arena-e2e.test'
const CUSTOM_LAYER_NAME = 'Roads e2e'
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

/**
 * Locates the rows of the custom overlays in the Layers panel.
 * @param {Page} page - The page.
 * @returns {Locator} The rows.
 */
const customOverlayRows = (page: Page): Locator =>
  page.getByTestId(ids.railPanel('layers')).locator(`[data-testid^="${ids.overlayRow('custom-')}"]`)

/**
 * Waits for the response of a custom layers request.
 * @param {Page} page - The page.
 * @param {string} method - The HTTP method.
 * @param {string} path - A part of the URL.
 * @returns {Promise<Response>} The response.
 */
const waitForCustomLayersResponse = (page: Page, method: string, path: string) =>
  page.waitForResponse((response) => response.url().includes(path) && response.request().method() === method)

const layersControl = (page: Page): Locator =>
  page.getByTestId(ids.railPanel('layers')).locator('.leaflet-control-layers')

const overlayCheckbox = (page: Page, name: string): Locator =>
  layersControl(page).locator('label', { hasText: name }).locator('input.leaflet-control-layers-selector')

// English unit symbols (the test user's language)
const AREA_TOTAL = /^\d+(\.\d+)? (m²|ha|km²)$/
const DISTANCE_TOTAL = /^\d+(\.\d+)? (m|km)$/

/**
 * Returns a page point at an offset from the centre of the Leaflet map (south-west of the centre: away from the
 * measure bar at the top and the zoom buttons at the bottom right; the data layers are off when the map opens).
 * @param {Page} page - The page.
 * @param {number} dx - Horizontal offset in pixels.
 * @param {number} dy - Vertical offset in pixels.
 * @returns {Promise<{x: number, y: number}>} The point in page coordinates.
 */
const mapPoint = async (page: Page, dx: number, dy: number): Promise<{ x: number; y: number }> => {
  const box = await page.locator('.leaflet-container').boundingBox()
  if (!box) throw new Error('The map is not visible')
  return { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy }
}

/**
 * Returns the bounding box of a visible element.
 * @param {Locator} locator - The element.
 * @returns {Promise<{x: number, y: number, width: number, height: number}>} The box in page coordinates.
 */
const boxOf = async (locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> => {
  const box = await locator.boundingBox()
  if (!box) throw new Error('The element is not visible')
  return box
}

/**
 * Returns the permanent label of the finished measurement on the map.
 * @param {Page} page - The page.
 * @returns {Locator} The Leaflet tooltip.
 */
const measureLabel = (page: Page): Locator => page.locator('.leaflet-tooltip-pane .leaflet-tooltip')

test.describe('Map workspace', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('shows the top bar, the rail and the status bar instead of floating controls', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openMap(page)
    for (const key of ['baseMap', 'display', 'tools']) {
      await expect(page.getByTestId(ids.menuButton(key))).toBeVisible()
    }
    await expect(page.getByTestId(ids.rail)).toBeVisible()
    await expect(page.getByTestId(ids.statusBar)).toBeVisible()
    await expect(
      page.locator('.map-options, .map-kml-uploader-wrapper, .zoom-level, .leaflet-control-scale')
    ).toHaveCount(0)
    await expect(layersControl(page)).toHaveCount(1)
    await expect(page.locator('.leaflet-container .leaflet-control-layers')).toHaveCount(0)
    await expect(page.getByTestId(ids.statusBar).locator('.leaflet-control-attribution')).toHaveCount(1)
  })

  test('collapsing and switching rail tabs keeps the layers control', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const layersPanel = page.getByTestId(ids.railPanel('layers'))
    const legendPanel = page.getByTestId(ids.railPanel('legend'))
    await expect(layersPanel).toBeVisible()

    await page.getByTestId(ids.railTab('legend')).click()
    await expect(layersPanel).toBeHidden()
    await expect(legendPanel).toBeVisible()

    // clicking the open tab collapses the rail
    await page.getByTestId(ids.railTab('legend')).click()
    await expect(legendPanel).toBeHidden()
    await expect(layersPanel).toBeHidden()

    await page.getByTestId(ids.railTab('layers')).click()
    await expect(layersPanel).toBeVisible()
    const checkbox = overlayCheckbox(page, COORDINATE_LAYER)
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('switches the base map from the Base map menu', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await page.getByTestId(ids.menuButton('baseMap')).click()
    await page.getByTestId(ids.menuItem('baseMap-ESRI Topographic')).click()
    await expect(page.locator('.leaflet-tile-pane img.leaflet-tile[src*="World_Topo_Map"]').first()).toBeAttached()

    await page.getByTestId(ids.menuButton('baseMap')).click()
    await expect(page.getByTestId(ids.menuItem('baseMap-ESRI Topographic'))).toHaveAttribute('aria-checked', 'true')
    // wait for MUI to move focus into the menu, otherwise the workspace shortcut handler takes the Escape
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]'))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('cycles the coordinate notation of the status bar', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const coordinates = page.getByTestId(ids.statusCoordinates)
    const notation = page.getByTestId(ids.statusNotation)
    await expect(notation).toHaveText('Lat, Lon')
    await coordinates.click()
    await expect(notation).toHaveText('DMS')
    await coordinates.click()
    await expect(notation).toHaveText('UTM')
    await expect(coordinates).toContainText(/\d{1,2}[C-X] \d+ E \d+ N/)
    await coordinates.click()
    await expect(notation).toHaveText('Lat, Lon')
  })

  test('zooms to the data shown on the map', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const zoomToData = page.getByTestId(ids.quickButton('zoomToData'))
    await zoomToData.click()
    await expect(page.getByText('There is no data on the map to zoom to')).toBeVisible()

    await overlayCheckbox(page, COORDINATE_LAYER).check()
    const zoom = page.getByTestId(ids.statusZoom)
    const zoomBefore = (await zoom.textContent()) ?? ''
    // the points of the layer load asynchronously: retry until the map zooms
    await expect(async () => {
      await zoomToData.click()
      await expect(zoom).not.toHaveText(zoomBefore, { timeout: 1000 })
    }).toPass()
    // the sample records are at 41.9–43.9 N, 12.5–14.5 E; the mouse is on the bar, so the status shows the centre
    await expect(page.getByTestId(ids.statusCoordinates)).toContainText(/4[1-4]\.\d{5}, 1[2-5]\.\d{5}/)
  })

  test('the record location picker has the compact bar', async ({ page, sampleSurvey: _ }) => {
    await openRecord(page, sampleRecords[0].cluster_id, { unlock: true })
    await page.locator('.map-trigger-btn').first().click()
    const panel = page.locator('.panel-right.map-panel')
    await expect(panel.getByTestId(ids.toolbar)).toBeVisible()
    await expect(panel.getByTestId(ids.menuButton('baseMap'))).toBeVisible()
    await expect(panel.getByTestId(ids.menuButton('display'))).toBeVisible()
    await expect(panel.getByTestId(ids.menuButton('addData'))).toHaveCount(0)
    await expect(panel.getByTestId(ids.menuButton('tools'))).toHaveCount(0)
    await expect(panel.getByTestId(ids.quickButton('measureDistance'))).toBeVisible()
    await expect(panel.getByTestId(ids.rail)).toHaveCount(0)
    await expect(panel.getByTestId(ids.statusBar)).toBeVisible()
    await expect(panel.getByTestId(ids.toolbar)).toContainText(
      'Double click on the map or drag the marker to update the location'
    )
    // no overlays in the picker: no layers control
    await expect(panel.locator('.leaflet-control-layers')).toBeHidden()
  })

  test('uploads a KML file as a layer that can be hidden and removed', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await page.getByTestId(ids.menuButton('addData')).click()
    await expect(page.getByTestId(ids.menuItem('uploadFile'))).toBeVisible()
    await page.keyboard.press('Escape')

    await page
      .getByTestId(ids.uploadInput)
      .setInputFiles({ name: 'plots.kml', mimeType: 'application/vnd.google-earth.kml+xml', buffer: Buffer.from(KML) })
    const row = uploadedRows(page)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('plots.kml')
    // survey data overlays are off by default: the only marker is the placemark
    const markers = page.locator('.leaflet-marker-pane .leaflet-marker-icon')
    await expect(markers).toHaveCount(1)

    await row.getByRole('checkbox').uncheck()
    await expect(markers).toHaveCount(0)
    await row.getByRole('checkbox').check()
    await expect(markers).toHaveCount(1)

    await row.getByRole('button', { name: 'Remove plots.kml' }).click()
    await expect(row).toHaveCount(0)
    await expect(markers).toHaveCount(0)
  })

  test('unsupported and broken files show a message', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const input = page.getByTestId(ids.uploadInput)

    await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
    await expect(page.getByText('Unsupported file: choose a KML, KMZ, zipped Shapefile or GeoJSON file')).toBeVisible()

    await input.setInputFiles({
      name: 'broken.geojson',
      mimeType: 'application/geo+json',
      buffer: Buffer.from('{ "type": '),
    })
    await expect(page.getByText(/The file could not be read/)).toBeVisible()

    await expect(uploadedRows(page)).toHaveCount(0)
    // the map still works
    await page.getByTestId(ids.menuButton('baseMap')).click()
    await expect(page.getByRole('menu')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('the Imagery menu offers the Sentinel-2 search without Planet periods', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await page.getByTestId(ids.menuButton('imagery')).click()
    await expect(page.getByTestId(ids.menuItem('searchScenes'))).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('search goes to coordinates and marks them', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const search = page.getByTestId(ids.searchInput)
    await page.locator('.leaflet-container').click()
    await page.keyboard.press('Control+k')
    await expect(search).toBeFocused()

    await search.fill('41.9, 12.5')
    await expect(page.getByTestId(ids.searchResult(0))).toHaveText('Go to 41.90000, 12.50000')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId(ids.statusZoom)).toHaveText('Zoom 14')
    await expect(page.locator('.map-search-marker')).toHaveCount(1)

    // Escape clears the text and the mark
    await search.focus()
    await page.keyboard.press('Escape')
    await expect(search).toHaveValue('')
    await expect(page.locator('.map-search-marker')).toHaveCount(0)

    await search.fill('95, 12')
    await expect(page.getByTestId(ids.searchResult(0))).toHaveText('Coordinates out of range')
    await expect(page.getByTestId(ids.searchResult(0))).toHaveAttribute('aria-disabled', 'true')
  })

  test('Go to coordinates in the Tools menu focuses the search box', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await page.getByTestId(ids.menuButton('tools')).click()
    await page.getByTestId(ids.menuItem('goToCoordinates')).click()
    await expect(page.getByTestId(ids.searchInput)).toBeFocused()
  })

  test('typing m in the search box does not start measuring', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const measure = page.getByTestId(ids.quickButton('measureDistance'))
    await page.getByTestId(ids.searchInput).fill('m')
    await page.keyboard.press('m')
    await expect(page.getByTestId(ids.searchInput)).toHaveValue('mm')
    await expect(measure).toHaveAttribute('aria-pressed', 'false')
  })

  test('letter shortcuts only act while focus is inside the workspace', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const measure = page.getByTestId(ids.quickButton('measureDistance'))
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('m')
    await expect(measure).toHaveAttribute('aria-pressed', 'false')

    await page.locator('.leaflet-container').click()
    await page.keyboard.press('m')
    await expect(measure).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(measure).toHaveAttribute('aria-pressed', 'false')
  })

  test('measures an area, changes its unit and ends with Escape in the unit select', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openMap(page)
    const measureArea = page.getByTestId(ids.quickButton('measureArea'))
    await measureArea.click()
    const bar = page.getByTestId(ids.measureBar)
    await expect(bar).toBeVisible()
    await expect(page.getByTestId(ids.measureModeArea)).toHaveAttribute('aria-pressed', 'true')
    await expect(measureArea).toHaveAttribute('aria-pressed', 'true')
    const total = page.getByTestId(ids.measureTotal)
    await expect(total).toHaveText('—')

    const point1 = await mapPoint(page, -160, 40)
    const point2 = await mapPoint(page, -40, 120)
    const point3 = await mapPoint(page, -170, 150)
    await page.mouse.click(point1.x, point1.y)
    await page.mouse.click(point2.x, point2.y)
    // the third point, then the double-click finishes the polygon
    await page.mouse.dblclick(point3.x, point3.y)

    await expect(total).toHaveText(AREA_TOTAL)
    await expect(page.getByTestId(ids.measurePerimeter)).toContainText(/\d.*(m|km)/)
    await expect(measureLabel(page)).toHaveText(AREA_TOTAL)

    const unit = page.getByTestId(ids.measureUnit)
    await unit.selectOption('ha')
    await expect(total).toHaveText(/^\d+(\.\d+)? ha$/)
    await expect(measureLabel(page)).toHaveText(/^\d+(\.\d+)? ha$/)

    // the workspace shortcuts ignore keys typed in a select: the bar ends the tool itself
    await unit.focus()
    await page.keyboard.press('Escape')
    await expect(bar).toHaveCount(0)
    await expect(measureArea).toHaveAttribute('aria-pressed', 'false')
    await expect(measureLabel(page)).toHaveCount(0)

    // the focus went back to the map: the shortcut starts the tool again
    await page.keyboard.press('m')
    await expect(page.getByTestId(ids.measureModeDistance)).toHaveAttribute('aria-pressed', 'true')
  })

  test('measures a distance, switches to area and ends with Done', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const measureDistance = page.getByTestId(ids.quickButton('measureDistance'))
    await measureDistance.click()
    await expect(page.getByTestId(ids.measureModeDistance)).toHaveAttribute('aria-pressed', 'true')

    const point1 = await mapPoint(page, -160, 40)
    const point2 = await mapPoint(page, -40, 120)
    await page.mouse.click(point1.x, point1.y)
    await page.mouse.click(point2.x, point2.y)
    const total = page.getByTestId(ids.measureTotal)
    // Enter typed in the search box does not finish the line
    await expect(total).toHaveText(DISTANCE_TOTAL)
    await page.getByTestId(ids.searchInput).focus()
    await page.keyboard.press('Enter')
    await expect(measureLabel(page)).toHaveCount(0)

    // the map has the focus again: Enter finishes the line
    await page.locator('.leaflet-container').focus()
    await page.keyboard.press('Enter')
    await expect(total).toHaveText(DISTANCE_TOTAL)
    await expect(measureLabel(page)).toHaveText(DISTANCE_TOTAL)

    await page.getByTestId(ids.measureModeArea).click()
    await expect(page.getByTestId(ids.measureModeArea)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId(ids.quickButton('measureArea'))).toHaveAttribute('aria-pressed', 'true')
    await expect(measureDistance).toHaveAttribute('aria-pressed', 'false')
    await expect(total).toHaveText('—')
    await expect(measureLabel(page)).toHaveCount(0)

    await page.getByTestId(ids.measureDone).click()
    await expect(page.getByTestId(ids.measureBar)).toHaveCount(0)

    // Done removed the focused button with the bar: the focus went back to the map, so the shortcuts still work
    await page.keyboard.press('m')
    await expect(measureDistance).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(measureDistance).toHaveAttribute('aria-pressed', 'false')
  })

  test('finishing a measurement by double-click in the record location picker keeps the marker', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openRecord(page, sampleRecords[0].cluster_id, { unlock: true })
    await page.locator('.map-trigger-btn').first().click()
    const panel = page.locator('.panel-right.map-panel')
    const marker = panel.locator('.leaflet-marker-icon').first()
    await expect(marker).toBeVisible()
    // wait for the panel and map animations to settle
    let previous = await marker.boundingBox()
    await expect
      .poll(async () => {
        const current = await marker.boundingBox()
        const settled = JSON.stringify(current) === JSON.stringify(previous)
        previous = current
        return settled
      })
      .toBe(true)
    const markerBox = await boxOf(marker)

    await panel.getByTestId(ids.quickButton('measureDistance')).click()
    const mapBox = await boxOf(panel.locator('.leaflet-container'))
    const at = (dx: number, dy: number): { x: number; y: number } => ({
      x: mapBox.x + mapBox.width / 2 + dx,
      y: mapBox.y + mapBox.height / 2 + dy,
    })
    // two points, then the double-click finishes on the marker itself
    const p1 = at(-60, 60)
    const p2 = at(60, 60)
    await page.mouse.click(p1.x, p1.y)
    await page.mouse.click(p2.x, p2.y)
    await page.mouse.dblclick(markerBox.x + markerBox.width / 2, markerBox.y + markerBox.height / 2)

    await expect(panel.getByTestId(ids.measureTotal)).toHaveText(DISTANCE_TOTAL)
    // the permanent label proves the double-click finished the measurement
    await expect(measureLabel(page)).toHaveText(DISTANCE_TOTAL)
    // the double-click did not move the record location
    await expect.poll(() => marker.boundingBox()).toEqual(markerBox)
  })

  test('adds an XYZ overlay for the current user, keeps it after a reload and removes it', async ({
    page,
    api,
    sampleSurvey,
  }) => {
    let tileRequests = 0
    await page.route(`${CUSTOM_TILE_HOST}/**`, (route) => {
      tileRequests += 1
      return route.fulfill({ status: 200, contentType: 'image/png', body: ONE_PIXEL_PNG })
    })
    await openMap(page)

    await page.getByTestId(ids.menuButton('addData')).click()
    await page.getByTestId(ids.menuItem('addWms')).click()
    const dialog = page.getByTestId(ids.wmsDialog)
    await expect(dialog).toBeVisible()
    await dialog.getByTestId(ids.wmsUrlInput).fill(`${CUSTOM_TILE_HOST}/{z}/{x}/{y}.png`)
    await dialog.getByTestId(ids.wmsLoadButton).click()
    await expect(dialog.getByTestId(ids.wmsSummary)).toContainText('XYZ')

    // "m" pressed on a focused button of the dialog must not start the measure tool
    await dialog.getByTestId(ids.wmsAddAs('overlay')).focus()
    await page.keyboard.press('m')
    await expect(page.getByTestId(ids.quickButton('measureDistance'))).not.toHaveAttribute('aria-pressed', 'true')
    await expect(dialog).toBeVisible()

    await dialog.getByTestId(ids.wmsNameInput).fill(CUSTOM_LAYER_NAME)
    await dialog.getByRole('radio', { name: 'Only me' }).check()
    const saved = waitForCustomLayersResponse(page, 'POST', '/geo/map/custom-layers/user')
    await dialog.getByTestId(ids.wmsSubmit).click()
    expect((await saved).ok()).toBe(true)
    await expect(dialog).toBeHidden()

    // the dialog opens the Layers tab on an overlay
    await expect(page.getByTestId(ids.railPanel('layers'))).toBeVisible()
    await expect(customOverlayRows(page)).toHaveCount(1)
    await expect(customOverlayRows(page)).toContainText(CUSTOM_LAYER_NAME)
    await expect.poll(() => tileRequests).toBeGreaterThan(0)

    await page.reload()
    await expect(page.getByTestId(ids.railPanel('layers'))).toBeVisible()
    await expect(customOverlayRows(page)).toHaveCount(1)

    const removed = waitForCustomLayersResponse(page, 'DELETE', '/geo/map/custom-layers/user/')
    await customOverlayRows(page)
      .getByRole('button', { name: `Remove ${CUSTOM_LAYER_NAME}` })
      .click()
    expect((await removed).ok()).toBe(true)
    await expect(customOverlayRows(page)).toHaveCount(0)

    const { status, body } = await api.getRaw(`/api/survey/${sampleSurvey.id}/geo/map/custom-layers`)
    expect(status).toBe(200)
    expect(body).toEqual({ surveyLayers: [], userLayers: [] })
  })

  test('refuses capabilities URLs that point to the server or its network', async ({ api, sampleSurvey }) => {
    const urls = [
      'http://127.0.0.1/',
      'http://0x7f.1/',
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:9096/',
      'http://[::1]/',
      'http://[::ffff:127.0.0.1]/',
      'file:///etc/passwd',
    ]
    for (const url of urls) {
      const params = new URLSearchParams({ url })
      const { status, body } = await api.getRaw(`/api/survey/${sampleSurvey.id}/geo/map/capabilities?${params}`)
      expect(status, url).toBe(400)
      expect((body as { key?: string } | null)?.key, url).toBe('appErrors:mapCustomLayers.urlNotAllowed')
    }
  })
})
