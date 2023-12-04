import { TestId, getSelector } from '../../../webapp/utils/testId'
import { getSurveyZipPath } from '../paths'
import { survey, surveyImport } from '../mock/survey'
import { gotoHome, gotoSurveyCreate, gotoSurveyList } from './_navigation'
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
      test.setTimeout(20000)
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
      await page.reload()
    })

    gotoHome()

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
