import { survey } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import {
  exportSurvey,
  removeExportSurveyFiles,
  verifyActivityLog,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
} from './_surveyExport'
import { selectSurvey } from './_surveyList'

export default () =>
  describe('Survey export', () => {
    gotoSurveyList()

    selectSurvey(survey)

    exportSurvey(survey)

    verifySurvey(survey)

    verifyNodeDefs(survey)

    verifyCategories(survey)

    verifyTaxonomies(survey)

    verifyRecords(survey)

    verifyUsers(survey)

    verifyActivityLog(survey)

    removeExportSurveyFiles(survey)
  })
