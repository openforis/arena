import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { getSurveyZipPath } from '../paths'
import { survey, surveyImport } from '../mock/survey'
import { gotoSurveyCreate, gotoSurveyList } from './_navigation'
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

let _surveyImport = { ...surveyImport }
export default () =>
  describe('Survey import', () => {
    exportSurvey(survey)

    gotoSurveyCreate()

    test(`Import survey `, async () => {
      const input = await page.$(getSelector(DataTestId.surveyCreate.importFromArena), 'input')
      await Promise.all([
        page.waitForResponse('**/survey/**'), // job status response
        input.setInputFiles(getSurveyZipPath(survey)),
      ])
      const [response] = await Promise.all([
        page.waitForResponse('**/survey/**'), // created survey
        page.waitForNavigation(),
        page.click(DataTestId.modal.close),
      ])

      const json = await response.json()

      surveyImport.name = json.survey.info.props.name
      _surveyImport = { ..._surveyImport, name: json.survey.info.props.name }
      await page.reload()
    })

    exportSurvey(_surveyImport)

    verifySurvey(_surveyImport)

    verifyNodeDefs(_surveyImport)

    verifyCategories(_surveyImport)

    verifyTaxonomies(_surveyImport)

    verifyRecords(_surveyImport)

    verifyUsers(_surveyImport)

    verifyActivityLog(_surveyImport)

    gotoSurveyList()

    selectSurvey(survey)
  })
