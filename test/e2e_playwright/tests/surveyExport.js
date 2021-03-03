import { survey } from '../mock/survey'
import {
  exportSurvey,
  removeExportedSurveyFiles,
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
    exportSurvey(survey)

    verifySurvey(survey)

    verifyNodeDefs(survey)

    verifyCategories(survey)

    verifyTaxonomies(survey)

    verifyRecords(survey)

    verifyUsers(survey)

    verifyActivityLog(survey)

    removeExportedSurveyFiles(survey)
  })
