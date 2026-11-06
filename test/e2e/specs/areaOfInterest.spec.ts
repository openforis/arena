import path from 'node:path'

import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'
import { aoiStatusMessages, insertAreaOfInterestSurvey, pilotAreaName } from '../fixtures/seed/areaOfInterestSurvey'
import { ArenaApi } from '../fixtures/arenaApi'
import { RecordForm } from '../helpers/recordForm'
import { Urls } from '../helpers/urls'
import { saveAreaScreenshot, saveScreenshot } from '../helpers/whatsNewScreenshots'

const geoJsonPath = path.resolve(__dirname, '..', 'resources', 'area_of_interest.geojson')

// set E2E_KEEP_DATA=true to keep the survey (e.g. to inspect it after a failure)
const deleteSurvey = async ({ api, surveyId }: { api: ArenaApi; surveyId: number }): Promise<void> => {
  if (process.env.E2E_KEEP_DATA !== 'true') await api.deleteSurveyIfExists(surveyId)
}

const defs = {
  reportId: { name: 'report_id', type: 'integer', key: true },
  location: { name: 'location', type: 'coordinate' },
}

const openMapTab = async (page: Page): Promise<Locator> => {
  await page.goto(Urls.surveyInfo)
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  const section = page.locator('.survey-info__areas-of-interest')
  await expect(section).toBeVisible()
  return section
}

const enterLocation = async ({
  page,
  form,
  x,
  y,
  accuracy,
}: {
  page: Page
  form: RecordForm
  x: string
  y: string
  accuracy: string
}): Promise<void> => {
  // the accuracy must change at every call: no request is sent for an unchanged value
  await form.enter(defs.location, { x, y, srs: '4326' })
  const accuracyInput = form.nodeDefWrapper(defs.location.name).getByRole('textbox').nth(2)
  const persisted = page.waitForResponse(
    (response) => response.request().method() === 'POST' && /\/record\/[\w-]+\/node$/.test(response.url())
  )
  await accuracyInput.fill(accuracy)
  await accuracyInput.blur()
  await persisted
  await form.waitForHeaderLoader()
}

test.describe('Area of interest', () => {
  test('adds, saves and deletes an area of interest', async ({ page, survey: _ }) => {
    let section = await openMapTab(page)

    await section.getByRole('button', { name: 'Add' }).click()
    const dialog = page.locator('.file-upload-dialog')
    const okButton = dialog.getByRole('button', { name: 'Ok' })
    await dialog.locator('input[type="file"]').setInputFiles(geoJsonPath)
    // the dropped file is previewed on a map
    await expect(dialog.locator('.map-file-preview .leaflet-overlay-pane path')).toBeVisible()
    // the name is used in the expressions: normalized while typing, keywords not allowed
    const nameInput = dialog.getByRole('textbox').first()
    await nameInput.fill('length')
    await expect(okButton).toBeDisabled()
    await nameInput.fill('Pilot Area')
    await expect(nameInput).toHaveValue(pilotAreaName)
    await okButton.click()

    const row = section.getByRole('row').filter({ hasText: pilotAreaName })
    await expect(row).toContainText('area_of_interest.geojson')
    await expect(row.getByRole('gridcell', { name: '5', exact: true })).toBeVisible()

    await row.getByRole('button', { name: 'Show on map' }).click()
    const mapPanel = page.locator('.panel-right.map-panel')
    await expect(mapPanel.locator('.leaflet-overlay-pane path')).toBeVisible()
    await mapPanel.getByTestId(TestId.panelRight.closeBtn).click()
    await expect(mapPanel).toHaveCount(0)

    await page.getByTestId(TestId.surveyInfo.saveBtn).click()
    await expect(page.getByText('Saved!')).toBeVisible()

    section = await openMapTab(page)
    await expect(row).toBeVisible()
    await saveScreenshot(section, 'areaOfInterestEditor')

    await row.locator('.btn-delete').click()
    await page.getByRole('button', { name: 'Ok' }).click()
    await expect(row).toHaveCount(0)
  })

  test('location status in data entry, using geoDistanceToAOIBoundary and the location accuracy', async ({
    page,
    testUser,
    api,
  }, testInfo) => {
    const name = generateSurveyName(testInfo.parallelIndex)
    const surveyId = await insertAreaOfInterestSurvey({ userEmail: testUser.email, name, label: 'Citizen reports' })
    try {
      const form = new RecordForm(page)
      await page.goto(Urls.records)
      await page.getByTestId(TestId.records.addBtn).click()
      await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
      await form.enter(defs.reportId, '1')

      const status = form.nodeDefWrapper('aoi_status').locator('input')

      // inside, far from the boundary
      await enterLocation({ page, form, x: '12.49', y: '41.89', accuracy: '10' })
      await expect(status).toHaveValue('inside')

      // outside
      await enterLocation({ page, form, x: '12.51', y: '41.89', accuracy: '15' })
      await expect(status).toHaveValue('outside')
      await form.errorBadge('aoi_status').hover()
      await expect(page.getByText(aoiStatusMessages.outside)).toBeVisible()
      await saveAreaScreenshot({
        page,
        locators: [form.nodeDefWrapper(defs.location.name), form.nodeDefWrapper('aoi_status')],
        name: 'areaOfInterestOutside',
        marginBottom: 40,
        marginRight: 60,
      })
      await page.mouse.move(0, 0)

      // inside but close to the boundary (~8 m) with a poor accuracy
      await enterLocation({ page, form, x: '12.4801', y: '41.89', accuracy: '30' })
      await expect(status).toHaveValue('uncertain')
      await form.errorBadge('aoi_status').hover()
      await expect(page.getByText(aoiStatusMessages.uncertain)).toBeVisible()
      await saveAreaScreenshot({
        page,
        locators: [form.nodeDefWrapper(defs.location.name), form.nodeDefWrapper('aoi_status')],
        name: 'areaOfInterestUncertain',
        marginBottom: 40,
        marginRight: 60,
      })
    } finally {
      await deleteSurvey({ api, surveyId })
    }
  })
})
