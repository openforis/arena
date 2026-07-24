import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { BASE_URL } from '../../config'

export const clickSurvey = async (survey) => {
  const surveyRowSelector = getSelector(survey.name)
  await page.waitForSelector(surveyRowSelector, { timeout: 5000 })

  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/landing/` } */),
    page.click(surveyRowSelector),
  ])

  await page.goto(`${BASE_URL}/app/dashboard/`)

  const surveyNameSelector = getSelector(TestId.dashboard.surveyName, 'h3')
  expect(await page.innerText(surveyNameSelector)).toBe(survey.name)
}

export const selectSurvey = (survey) => test(`Select survey ${survey.name}`, async () => clickSurvey(survey))
