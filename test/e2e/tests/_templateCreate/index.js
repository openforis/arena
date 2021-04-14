import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoTemplateCreate } from '../_navigation'

export const createTemplate = (template) => {
  gotoTemplateCreate()

  test(`Create Template ${template.name}`, async () => {
    const { label, name } = template

    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

    await Promise.all([
      page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
      page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
    ])

    const labelSelector = getSelector(DataTestId.dashboard.surveyLabel, 'h3')
    await expect(await page.innerText(labelSelector)).toBe(label.toUpperCase())
  })
}
