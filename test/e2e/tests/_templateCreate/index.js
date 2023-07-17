import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { gotoTemplateCreate } from '../_navigation'

export const createTemplate = (template) => {
  gotoTemplateCreate()

  const { cloneFromLabel, label, name } = template

  test(`Create Template ${name}`, async () => {
    await page.fill(getSelector(TestId.surveyCreate.surveyName, 'input'), name)

    if (cloneFromLabel) {
      await page.click(getSelector(TestId.surveyCreate.createTypeBtn({ prefix: 'templateCreateType', type: 'clone' })))
      await FormUtils.selectDropdownItem({ testId: TestId.surveyCreate.surveyCloneFrom, label: cloneFromLabel })
      await page.click(getSelector(TestId.surveyCreate.submitBtn, 'button'))
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(TestId.modal.close),
      ])
    } else {
      await page.fill(getSelector(TestId.surveyCreate.surveyLabel, 'input'), label)

      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(getSelector(TestId.surveyCreate.submitBtn, 'button')),
      ])
    }

    const surveyTitleSelector = getSelector(TestId.header.surveyTitle)
    await expect(await page.innerText(surveyTitleSelector)).toBe(`${label} [${name}]`)
  })
}
