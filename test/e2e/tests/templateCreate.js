import { test } from '@playwright/test'

import { template, template2 } from '../mock/survey'
import { createTemplate } from './_templateCreate'
import { selectSurvey } from './_surveyList'
import { gotoTemplateList } from './_navigation'

export default () =>
  test.describe('Template Create', () => {
    createTemplate(template)

    createTemplate(template2)

    // verify template
    gotoTemplateList()
    selectSurvey(template)

    // verify template2
    gotoTemplateList()
    selectSurvey(template2)
  })
