import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoTemplateCreate } from '../_navigation'

export const createTemplate = (template) => {
  gotoTemplateCreate()

  const { cloneFrom, label, name } = template

  test(`Create Template ${name}`, async () => {
    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

    if (cloneFrom) {
      await page.focus(getSelector(DataTestId.surveyCreate.surveyCloneFrom, 'input'))
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
