import { test } from '@playwright/test'

import { survey, survey2 } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import { createSurvey } from './_surveyCreate'
import { selectSurvey } from './_surveyList'

export default () =>
  test.describe('Survey Create', () => {
    createSurvey(survey)

    createSurvey(survey2)

    gotoSurveyList()

    selectSurvey(survey)
  })
