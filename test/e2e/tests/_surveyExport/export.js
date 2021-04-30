import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { getSurveyDirPath, getSurveyZipPath, downloadsSurveysPath } from '../../downloads/path'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey.name}`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    // start export
    await page.click(getSelector(DataTestId.dashboard.surveyExportBtn, 'button'))
    await page.waitForSelector(getSelector(DataTestId.modal.modal))

    // click on download button and wait for response
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForResponse(/.+\/download\?.*/),
      page.click(DataTestId.surveyExport.downloadBtn),
    ])

    // save exported file into temp directory
    await download.saveAs(surveyZipPath)
    const zip = new AdmZip(surveyZipPath)

    // extract the zip file and verify it exists
    zip.extractAllTo(surveyDirPath, true, '')
    await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
  })

export const removeExportSurveyFiles = async () => {
  test(`Remove exported survey files`, async () => {
    fs.rmdirSync(downloadsSurveysPath, { recursive: true })
    await expect(fs.existsSync(downloadsSurveysPath)).toBeFalsy()
  })
}
