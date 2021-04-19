import { survey, surveyFromTemplate } from '../mock/survey'
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
  describe('Survey create from template', () => {
    createSurvey(surveyFromTemplate)

    exportSurvey(surveyFromTemplate)
    verifySurvey(surveyFromTemplate)
    verifyNodeDefs(surveyFromTemplate)
    verifyCategories(surveyFromTemplate)
    verifyTaxonomies(surveyFromTemplate)
    verifyRecords(surveyFromTemplate, [])
    verifyUsers(surveyFromTemplate)
    verifyActivityLog(surveyFromTemplate)
    removeExportSurveyFiles(surveyFromTemplate)

    gotoSurveyList()
    selectSurvey(survey)
  })
