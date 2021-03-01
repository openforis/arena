import AdmZip from 'adm-zip'
import fs from 'fs'

import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { downloadsPath, getSurveyDirPath, getSurveyZipPath } from '../downloads/path'
import { survey } from '../mock/survey'
import {
  verifyActivityLog,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
} from './_surveyExport'

export default () =>
  describe('Survey export', () => {
    const surveyZipPath = getSurveyZipPath(survey)
    const surveyDirPath = getSurveyDirPath(survey)

    test(`Export survey ${survey.name}`, async () => {
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

    verifySurvey(survey)

    verifyNodeDefs(survey)

    verifyCategories(survey)

    verifyTaxonomies(survey)

    verifyRecords(survey)

    verifyUsers(survey)

    verifyActivityLog(survey)

    test(`Delete exported survey ${survey.name} files`, async () => {
      fs.rmSync(surveyZipPath)
      fs.rmdirSync(surveyDirPath, { recursive: true })

      await expect(fs.existsSync(surveyZipPath)).toBeFalsy()
      await expect(fs.existsSync(surveyDirPath)).toBeFalsy()
    })
  })
