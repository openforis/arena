import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { getSurveyDirPath, getSurveyZipPath } from '../../paths'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey.name}`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    await page.click(getSelector(DataTestId.dashboard.surveyExportBtn, 'button'))
    await page.waitForSelector(getSelector(DataTestId.modal.modal))

    if (survey.isImport) {
      await expect({
        surveyZipPath,
        surveyDirPath,
        survey,
      }).toBe('aa')
    }

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
