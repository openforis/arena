import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'

export const clickSurvey = async (survey, label = null) => {
  // FIX_TEST
  const TEST_ID = 'surveys_1'
  const row = await page.waitForSelector(getSelector(TEST_ID))
  const classNames = await row.getAttribute('class')
  const isActive = classNames.includes('active')

  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
    isActive ? page.click(getSelector(DataTestId.sidebar.moduleBtn('home'), 'a')) : page.click(getSelector(TEST_ID)),
  ])

  const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
  const expectedLabel = label || survey.labels.en
  expect(await page.innerText(labelSelector)).toBe(expectedLabel.toUpperCase())
}

export const clickTemplate = async (survey, label = null) => {
  const row = await page.waitForSelector(getSelector(survey.name))
  const classNames = await row.getAttribute('class')
  const isActive = classNames.includes('active')

  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
    isActive
      ? page.click(getSelector(DataTestId.sidebar.moduleBtn('home'), 'a'))
      : page.click(getSelector(survey.name)),
  ])

  const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
  const expectedLabel = label || survey.labels.en
  expect(await page.innerText(labelSelector)).toBe(expectedLabel.toUpperCase())
}

export const selectSurvey = (survey, label = null) =>
  test(`Select survey ${survey.name}`, async () => clickSurvey(survey, label))

export const selectTemplate = (survey, label = null) =>
  test(`Select survey template ${survey.name}`, async () => clickTemplate(survey, label))
