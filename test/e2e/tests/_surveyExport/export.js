import AdmZip from 'adm-zip'
import fs from 'fs'

import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { BASE_URL } from '../../config'
import { getSurveyDirPath, getSurveyZipPath } from '../../paths'

const DASHBOARD_URL = `${BASE_URL}/app/dashboard/`
const EXPORT_TEST_TIMEOUT_MS = 60000

export const exportSurvey = (survey) =>
  test(
    `Export survey ${survey?.name}`,
    async () => {
      const surveyZipPath = getSurveyZipPath(survey)
      const surveyDirPath = getSurveyDirPath(survey)

      // Avoid remounting the dashboard when already there (defs reload is slow after import).
      if (!page.url().startsWith(DASHBOARD_URL)) {
        await page.goto(DASHBOARD_URL)
      }

      const exportButtonMenuSelector = getSelector(TestId.dashboard.surveyExportBtn, 'button')
      await page.waitForSelector(exportButtonMenuSelector, { timeout: 30000 })
      await page.click(exportButtonMenuSelector)

      const exportWithDataButtonSelector = getSelector(
        survey.template ? TestId.dashboard.surveyExportOnlySurveyBtn : TestId.dashboard.surveyExportWithDataBtn,
        'button'
      )
      await Promise.all([
        page.waitForSelector(getSelector(TestId.modal.modal)),
        page.click(exportWithDataButtonSelector),
      ])

      await page.waitForSelector(TestId.surveyExport.downloadBtn)

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click(TestId.surveyExport.downloadBtn),
      ])

      await download.saveAs(surveyZipPath)

      const zip = new AdmZip(surveyZipPath)
      zip.extractAllTo(surveyDirPath, true, '')

      await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
    },
    EXPORT_TEST_TIMEOUT_MS
  )
