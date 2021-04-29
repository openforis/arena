import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoSurveyCreate } from '../_navigation'

export const createSurvey = (surveyToAdd) => {
  gotoSurveyCreate()

  test(`Create Survey ${surveyToAdd.name}`, async () => {
    const { cloneFrom, label, name } = surveyToAdd

    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

    if (cloneFrom) {
      // set cloneFrom into Clone from field
      await page.click(`#${DataTestId.surveyCreate.surveyCloneFrom}`)
      await page.click(`text="${cloneFrom}"`)
    }
    // click Create Survey and wait for the job to complete
    await Promise.all([
      page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
      ...(cloneFrom ? [page.click(DataTestId.modal.close)] : []),
      page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
    ])

    const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
    await expect(await page.innerText(labelSelector)).toBe(label.toUpperCase())
  })
}
