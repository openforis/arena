import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'
import { expect, test } from '../fixtures'
import { sampleRecords, samplingPointData } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

const ids = TestId.mapWorkspace

// label of the coordinate attribute of the sample survey (its overlay in the layers control)
const COORDINATE_LAYER = 'Cluster coordinate'
const SAMPLING_POINT_LAYER = 'Sampling point data - level 1'

const openMap = async (page: Page): Promise<void> => {
  await page.goto(Urls.map)
  await expect(page.getByTestId(ids.toolbar)).toBeVisible()
}

const overlayCheckbox = (page: Page, name: string): Locator =>
  page
    .getByTestId(ids.railPanel('layers'))
    .locator('.leaflet-control-layers label', { hasText: name })
    .locator('input.leaflet-control-layers-selector')

const popup = (page: Page): Locator => page.locator('.leaflet-popup')

/**
 * Opens the popup of a point from the Records tab of the rail (the map flies to the point and opens its popup).
 * @param {string} label - The label of the point in the list (its keys).
 */
const openPointFromRecordsTab = async (page: Page, label: string): Promise<void> => {
  await page.getByTestId(ids.railTab('records')).click()
  await page.getByTestId(ids.rail).getByRole('button', { name: label, exact: true }).click()
  await expect(popup(page)).toBeVisible()
}

test.describe('Map data layers', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('the point popup shows the record path and owner, and goes to the next and previous points', async ({
    page,
    testUser,
    sampleSurvey: _,
  }) => {
    await openMap(page)
    await overlayCheckbox(page, COORDINATE_LAYER).check()
    await openPointFromRecordsTab(page, '2')

    await expect(popup(page)).toContainText('Cluster[2]')
    // the owner name is fetched when the popup opens
    await expect(popup(page)).toContainText(`Owner: ${testUser.name}`)

    await popup(page).getByRole('button', { name: 'Next' }).click()
    await expect(popup(page)).toContainText('Cluster[3]')

    // the last point is followed by the first one
    await popup(page).getByRole('button', { name: 'Next' }).click()
    await expect(popup(page)).toContainText('Cluster[1]')

    await popup(page).getByRole('button', { name: 'Previous' }).click()
    await expect(popup(page)).toContainText('Cluster[3]')
  })

  test('Edit record in the point popup opens the record in a dialog', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    await overlayCheckbox(page, COORDINATE_LAYER).check()
    await openPointFromRecordsTab(page, '3')

    await popup(page).getByRole('button', { name: 'Edit record' }).click()
    await expect(page.getByText('Record: 3', { exact: true })).toBeVisible()
    await expect(page.getByTestId(TestId.surveyForm.nodeDefWrapper('cluster_id')).getByRole('textbox')).toHaveValue('3')
  })

  test('the points close to each other are clustered, and a click on the cluster zooms in on it', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openMap(page)
    await overlayCheckbox(page, COORDINATE_LAYER).check()

    // at the initial zoom the three records (about 100 km from each other) are in one cluster
    const clusterMarker = page.locator('.cluster-marker')
    await expect(clusterMarker).toHaveCount(1)
    await expect(clusterMarker).toHaveText(String(sampleRecords.length))

    const zoom = page.getByTestId(ids.statusZoom)
    const zoomBefore = (await zoom.textContent()) ?? ''
    await clusterMarker.click()
    await expect(zoom).not.toHaveText(zoomBefore)
    // zoomed in, the cluster splits
    await expect(page.locator('.cluster-marker', { hasText: String(sampleRecords.length) })).toHaveCount(0)
  })

  test('the Marker labels display option shows the record keys next to the markers', async ({
    page,
    sampleSurvey: _,
  }) => {
    await openMap(page)
    await overlayCheckbox(page, COORDINATE_LAYER).check()
    // close to the first record: its marker is not in a cluster
    await page.getByTestId(ids.searchInput).fill('41.9, 12.5')
    const goToResult = page.getByTestId(ids.searchResult(0))
    await expect(goToResult).toHaveText('Go to 41.90000, 12.50000')
    await goToResult.click()
    await expect(page.getByTestId(ids.statusZoom)).toHaveText('Zoom 14')

    const tooltips = page.locator('.leaflet-tooltip-pane .leaflet-tooltip')
    await expect(tooltips).toHaveCount(0)

    await page.getByTestId(ids.menuButton('display')).click()
    await page.getByTestId(ids.menuItem('display-showMarkersLabels')).click()
    await page.keyboard.press('Escape')
    await expect(tooltips).toHaveText([sampleRecords[0].cluster_id])
  })
})

test.describe('Map sampling point data layer', () => {
  test.use({ sampleSurveyOptions: { withSamplingPointData: true } })

  test('shows the sampling point data items and their popup', async ({ page, sampleSurvey: _ }) => {
    await openMap(page)
    const layerCheckbox = overlayCheckbox(page, SAMPLING_POINT_LAYER)
    await layerCheckbox.check()
    await expect(layerCheckbox).toBeChecked()

    const [firstItem, secondItem] = samplingPointData.items
    await openPointFromRecordsTab(page, firstItem.code)
    await expect(popup(page)).toContainText('Sampling Point Item')
    await expect(popup(page)).toContainText(`Level 1 code: ${firstItem.code}`)

    await popup(page).getByRole('button', { name: 'Next' }).click()
    await expect(popup(page)).toContainText(`Level 1 code: ${secondItem.code}`)

    // the sample survey has no key attribute linked to the sampling point data: no new record from an item
    await expect(popup(page).getByRole('button', { name: 'Create new record' })).toHaveCount(0)
  })
})
