import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoSurveyCreate } from '../_navigation'

export const createSurvey = (surveyToAdd) => {
  gotoSurveyCreate()

  test(`Create Survey ${surveyToAdd.name}`, async () => {
    const { cloneFrom, label, name } = surveyToAdd

    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

    if (cloneFrom) {
      await page.click(`#${DataTestId.surveyCreate.surveyCloneFrom}`)
      await page.click(`text="${cloneFrom}"`)
      await page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button'))
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(DataTestId.modal.close),
      ])
    } else {
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
      ])
    }

    const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
    await expect(await page.innerText(labelSelector)).toBe(label.toUpperCase())
  })
}
