import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { downloadsPath, getSurveyDirPath, getSurveyZipPath } from '../../downloads/path'

export const exportSurvey = (survey) =>
  test(`Export survey ${survey.name}`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForResponse('**/export/'),
      page.click(getSelector(DataTestId.dashboard.surveyExportBtn, 'button')),
    ])

    await download.saveAs(surveyZipPath)
    const zip = new AdmZip(surveyZipPath)
    zip.extractAllTo(downloadsPath, true, '')

    await expect(fs.existsSync(surveyDirPath)).toBeTruthy()
  })

export const removeExportedSurveyFiles = (survey) =>
  test(`Remove exported survey ${survey.name} files`, async () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    fs.rmSync(surveyZipPath)
    fs.rmdirSync(surveyDirPath, { recursive: true })

    await expect(fs.existsSync(surveyZipPath)).toBeFalsy()
    await expect(fs.existsSync(surveyDirPath)).toBeFalsy()
  })
