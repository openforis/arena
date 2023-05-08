import { expect, test } from '@playwright/test'

import { survey } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import {
  exportSurvey,
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
  test.describe('Survey export', () => {
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
  })
