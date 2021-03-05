import { survey, surveyClone } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import {
  exportSurvey,
  removeExportSurveyFiles,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
  verifyActivityLog,
} from './_surveyExport'
import { selectSurvey } from './_surveyList'
import { createSurvey } from './_surveyCreate'

export default () =>
  describe('Survey clone', () => {
    createSurvey(surveyClone)

    exportSurvey(surveyClone)
    verifySurvey(surveyClone)
    verifyNodeDefs(surveyClone)
    verifyCategories(surveyClone)
    verifyTaxonomies(surveyClone)
    verifyRecords(surveyClone, [])
    verifyUsers(surveyClone)
    verifyActivityLog(surveyClone)
    removeExportSurveyFiles(surveyClone)

    gotoSurveyList()
    selectSurvey(survey)
  })
