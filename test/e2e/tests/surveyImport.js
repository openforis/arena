import { TestId, getSelector } from '../../../webapp/utils/testId'
import { BASE_URL } from '../config'
import { getSurveyZipPath } from '../paths'
import { survey, surveyImport } from '../mock/survey'
import { gotoDashboard, gotoSurveyCreate, gotoSurveyList } from './_navigation'
import {
  exportSurvey,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
  verifyActivityLog,
} from './_surveyExport'
import { selectSurvey } from './_surveyList'

export default () =>
  describe('Survey import', () => {
    exportSurvey(survey)

    gotoSurveyCreate()

    test(`Import survey `, async () => {
      await page.click(getSelector(TestId.surveyCreate.createTypeBtn({ prefix: 'surveyCreateType', type: 'import' })))
      await page.click(getSelector(TestId.surveyCreate.optionIncludeDataCheckbox))
      const input = page.locator('.home-survey-create .dropzone input')
      await input.setInputFiles(getSurveyZipPath(survey))

      await Promise.all([
        page.waitForResponse('**/survey/**'), // job status response
        page.click(getSelector(TestId.surveyCreate.startImportBtn)),
      ])
      const [response] = await Promise.all([
        page.waitForResponse('**/survey/**'), // created survey
        page.waitForNavigation(),
        page.click(TestId.modal.close),
      ])

      const json = await response.json()

      surveyImport.name = json.survey.props.name
      // Import now lands on landing; open dashboard so export controls are ready
      // (previously home defaulted to dashboard after import).
      await page.goto(`${BASE_URL}/app/dashboard/`)
    })

    gotoDashboard()

    exportSurvey(surveyImport)

    verifySurvey(surveyImport)

    verifyNodeDefs(surveyImport)

    verifyCategories(surveyImport)

    verifyTaxonomies(surveyImport)

    verifyRecords(surveyImport)

    verifyUsers(surveyImport)

    verifyActivityLog(surveyImport)

    gotoSurveyList()

    selectSurvey(survey)
  })
