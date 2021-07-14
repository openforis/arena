import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

export const clickSurvey = async (survey) => {
  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
    page.click(getSelector(survey.name)),
  ])

  const labelSelector = getSelector(DataTestId.dashboard.surveyName, 'h3')
  expect(await page.innerText(labelSelector)).toBe(survey.name.toUpperCase())
}

export const selectSurvey = (survey) => test(`Select survey ${survey.name}`, async () => clickSurvey(survey))
