import path from 'node:path'

import { Locator, Page } from '@playwright/test'

import { TestId } from '@webapp/utils/testId'

import { expect, generateSurveyName, test } from '../fixtures'
import { aoiStatusMessages, insertAreaOfInterestSurvey } from '../fixtures/seed/areaOfInterestSurvey'
import { ArenaApi } from '../fixtures/arenaApi'
import { RecordForm } from '../helpers/recordForm'
import { Urls } from '../helpers/urls'

const geoJsonPath = path.resolve(__dirname, '..', 'resources', 'area_of_interest.geojson')

// set WHATS_NEW_SCREENSHOTS_DIR to save the screenshots used in the "What's new" dialog
const screenshotsDir = process.env.WHATS_NEW_SCREENSHOTS_DIR

const saveScreenshot = async (locator: Locator, name: string): Promise<void> => {
  if (screenshotsDir) await locator.screenshot({ path: path.join(screenshotsDir, `${name}.png`) })
}

// screenshot of the page area containing the specified elements, with some margin (e.g. for tooltips below them)
const saveAreaScreenshot = async ({
  page,
  locators,
  name,
  marginBottom = 0,
  marginRight = 0,
}: {
  page: Page
  locators: Locator[]
  name: string
  marginBottom?: number
  marginRight?: number
}): Promise<void> => {
  if (!screenshotsDir) return
  const boxes = (await Promise.all(locators.map((locator) => locator.boundingBox()))).filter((box) => !!box)
  const margin = 10
  const x = Math.min(...boxes.map((box) => box.x)) - margin
  const y = Math.min(...boxes.map((box) => box.y)) - margin
  const right = Math.max(...boxes.map((box) => box.x + box.width)) + margin + marginRight
  const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + margin + marginBottom
  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    clip: { x, y, width: right - x, height: bottom - y },
  })
}

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
  const section = page.locator('.survey-info__area-of-interest')
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
  test('uploads, saves and deletes the survey area of interest', async ({ page, survey: _ }) => {
    let section = await openMapTab(page)

    await section.locator('input[type="file"]').setInputFiles(geoJsonPath)
    await expect(section.getByText('1 polygon(s), 5 vertices')).toBeVisible()

    await page.getByTestId(TestId.surveyInfo.saveBtn).click()
    await expect(page.getByText('Saved!')).toBeVisible()

    section = await openMapTab(page)
    await expect(section.getByText('1 polygon(s), 5 vertices')).toBeVisible()
    await saveScreenshot(section, 'areaOfInterestEditor')

    await section.locator('.btn-delete').click()
    await page.getByRole('button', { name: 'Ok' }).click()
    await expect(section.locator('input[type="file"]')).toBeAttached()
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
      await page.mouse.move(0, 0)

      // inside but close to the boundary (~8 m) with a poor accuracy
      await enterLocation({ page, form, x: '12.4801', y: '41.89', accuracy: '30' })
      await expect(status).toHaveValue('uncertain')
      await form.errorBadge('aoi_status').hover()
      await expect(page.getByText(aoiStatusMessages.uncertain)).toBeVisible()
      await saveAreaScreenshot({
        page,
        locators: [form.nodeDefWrapper(defs.location.name), form.nodeDefWrapper('aoi_status')],
        name: 'areaOfInterestDataEntry',
        marginBottom: 40,
        marginRight: 60,
      })
    } finally {
      await deleteSurvey({ api, surveyId })
    }
  })
})
