import { test } from '@playwright/test'

import { publishWithoutErrors, verifySurveyPublished } from './_publish'

export default () =>
  test.describe('Template Publish', () => {
    // template templateFromSurvey already selected and already in home page

    publishWithoutErrors({ inHomePage: true })

    verifySurveyPublished()
  })
