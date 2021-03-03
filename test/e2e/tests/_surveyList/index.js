import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

export const clickSurvey = async (survey, label = null) => {
  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
    page.click(getSelector(survey.name)),
  ])

  const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
  const expectedLabel = label || survey.labels.en
  expect(await page.innerText(labelSelector)).toBe(expectedLabel.toUpperCase())
}

export const selectSurvey = (survey, label = null) =>
  test(`Select survey ${survey.name}`, async () => clickSurvey(survey, label))
