import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../../webapp/utils/testId'

export const clickSurvey = async (survey) => {
  const surveyRowSelector = getSelector(survey.name)
  await page.waitForSelector(surveyRowSelector, { timeout: 5000 })

  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
    page.click(surveyRowSelector),
  ])

  const labelSelector = getSelector(TestId.dashboard.surveyName, 'h3')
  expect(await page.innerText(labelSelector)).toBe(survey.name.toUpperCase())
}

export const selectSurvey = (survey) => test(`Select survey ${survey.name}`, async () => clickSurvey(survey))
