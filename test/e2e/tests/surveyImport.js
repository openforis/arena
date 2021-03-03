import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { getSurveyZipPath } from '../downloads/path'
import { survey, surveyImport } from '../mock/survey'
import { gotoSurveyCreate, gotoSurveyList } from './_navigation'
import {
  exportSurvey,
  removeExportSurveyFiles,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
} from './_surveyExport'
import { selectSurvey } from './_surveyList'
// import { verifySurveyPublished } from './_publish'

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
    })
    removeExportSurveyFiles(survey)

    exportSurvey(surveyImport)

    verifySurvey(surveyImport)

    verifyNodeDefs(surveyImport)

    verifyCategories(surveyImport)

    verifyTaxonomies(surveyImport)

    verifyRecords(surveyImport)

    verifyUsers(surveyImport)

    // TODO uncomment this when fixing https://github.com/openforis/arena/issues/1424
    // verifyActivityLog(surveyImport)

    // TODO: uncomment this when fixing https://github.com/openforis/arena/issues/1427
    // verifySurveyPublished()

    removeExportSurveyFiles(surveyImport)

    gotoSurveyList()

    selectSurvey(survey)
  })
