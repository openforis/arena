import { DataTestId, getSelector } from '../../../../webapp/utils/dataTestId'
import { gotoTemplateCreate } from '../_navigation'

export const createTemplate = (template) => {
  gotoTemplateCreate()

  const { cloneFrom, label, name } = template

  test(`Create Template ${name}`, async () => {
    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)

    if (cloneFrom) {
      await page.click(
        getSelector(DataTestId.surveyCreate.createTypeBtn({ prefix: 'templateCreateType', type: 'clone' }))
      )
      await page.click(`#${DataTestId.surveyCreate.surveyCloneFrom}`)
      await page.click(`text="${cloneFrom}"`)
      await page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button'))
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(DataTestId.modal.close),
      ])
    } else {
      await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
      ])
    }

    const surveyTitleSelector = getSelector(DataTestId.header.surveyTitle)
    await expect(await page.innerText(surveyTitleSelector)).toBe(`${label}`)
  })
}
