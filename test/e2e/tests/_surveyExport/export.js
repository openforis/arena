import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { getSurveyDirPath, getSurveyZipPath } from '../../paths'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey.name}`, async () => {
    await page.reload()
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    await Promise.all([
      page.waitForSelector(getSelector(DataTestId.modal.modal)),
      page.click(getSelector(DataTestId.dashboard.surveyExportBtn, 'button')),
    ])

    await page.waitForSelector(DataTestId.surveyExport.downloadBtn)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForResponse(/.+\/download\?.*/),
      page.click(DataTestId.surveyExport.downloadBtn),
    ])

    await download.saveAs(surveyZipPath)

    const zip = new AdmZip(surveyZipPath)
    zip.extractAllTo(surveyDirPath, true, '')

    await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
  })
