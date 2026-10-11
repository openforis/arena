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

const layersControl = (page: Page): Locator =>
  page.getByTestId(ids.railPanel('layers')).locator('.leaflet-control-layers')

const overlayCheckbox = (page: Page, name: string): Locator =>
  layersControl(page).locator('label', { hasText: name }).locator('input.leaflet-control-layers-selector')

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

  test('the Imagery menu is hidden when the base map has no periods', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await expect(page.getByTestId(ids.menuButton('addData'))).toBeVisible()
    await expect(page.getByTestId(ids.menuButton('imagery'))).toHaveCount(0)
  })
})
