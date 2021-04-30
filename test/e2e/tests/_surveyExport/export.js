import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { getSurveyDirPath, getSurveyZipPath } from '../../paths'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey.name}`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    // click on Export button
    await page.click(getSelector(DataTestId.dashboard.surveyExportBtn, 'button'))

    // wait for export job to complete
    await page.waitForSelector(getSelector(DataTestId.modal.modal))

    // click on Donwload button and download generated file
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForResponse(/.+\/download\?.*/),
      page.click(DataTestId.surveyExport.downloadBtn),
    ])

    // save and extract generated zip file
    await download.saveAs(surveyZipPath)
    const zip = new AdmZip(surveyZipPath)
    zip.extractAllTo(surveyDirPath, true, '')

    // check that the exported files exist
    await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
  })
