import AdmZip from 'adm-zip'
import fs from 'fs'

import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { getSurveyDirPath, getSurveyZipPath } from '../../paths'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey?.name}`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    const exportButtonMenuSelector = getSelector(TestId.dashboard.surveyExportBtn, 'button')
    await page.waitForSelector(exportButtonMenuSelector)
    await page.click(exportButtonMenuSelector)
    const exportWithDataButtonSelector = getSelector(TestId.dashboard.surveyExportWithDataBtn)
    await page.waitForSelector(exportWithDataButtonSelector)

    await Promise.all([
      page.waitForSelector(getSelector(TestId.modal.modal)),
      page.click(getSelector(exportWithDataButtonSelector)),
    ])

    await page.waitForSelector(TestId.surveyExport.downloadBtn)

    const [download] = await Promise.all([page.waitForEvent('download'), page.click(TestId.surveyExport.downloadBtn)])

    await download.saveAs(surveyZipPath)

    const zip = new AdmZip(surveyZipPath)
    zip.extractAllTo(surveyDirPath, true, '')

    await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
  })
