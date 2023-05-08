import { expect, test } from '@playwright/test'

import { survey, surveyFromTemplate } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import {
  exportSurvey,
  verifyCategories,
  verifyNodeDefs,
  verifyRecords,
  verifySurvey,
  verifyTaxonomies,
  verifyUsers,
} from './_surveyExport'
import { selectSurvey } from './_surveyList'
import { createSurvey } from './_surveyCreate'

export default () =>
  test.describe('Survey create from template', () => {
    createSurvey(surveyFromTemplate)

    exportSurvey(surveyFromTemplate)

    verifySurvey(surveyFromTemplate)
    verifyNodeDefs(surveyFromTemplate)
    verifyCategories(surveyFromTemplate)
    verifyTaxonomies(surveyFromTemplate)
    verifyRecords(surveyFromTemplate, [])
    verifyUsers(surveyFromTemplate)

    gotoSurveyList()
    selectSurvey(survey)
  })
