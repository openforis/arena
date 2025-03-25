import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { gotoTemplateCreate } from '../_navigation'

export const createTemplate = (template) => {
  gotoTemplateCreate()

  const { cloneFrom, cloneFromType, cloneFromLabel, label, name } = template

  test(`Create Template ${name}`, async () => {
    await FormUtils.fillInput(TestId.surveyCreate.surveyName, name)

    if (cloneFrom) {
      // select create type "Clone"
      await page.click(getSelector(TestId.surveyCreate.createTypeBtn({ prefix: 'templateCreateType', type: 'clone' })))

      // select clone from type (survey or template)
      const cloneFromTypeLocator = page.locator(
        `.clone-from-type_btn-group .radio-button-group-item >> text="${cloneFromType}"`
      )
      await cloneFromTypeLocator.waitFor()
      await cloneFromTypeLocator.click()

      await FormUtils.selectDropdownItem({
        testId: TestId.surveyCreate.surveyCloneFrom,
        label: `${cloneFrom} - ${cloneFromLabel}`,
      })
      await page.click(getSelector(TestId.surveyCreate.submitBtn, 'button'))
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(TestId.modal.close),
      ])
    } else {
      await FormUtils.fillInput(TestId.surveyCreate.surveyLabel, label)

      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(getSelector(TestId.surveyCreate.submitBtn, 'button')),
      ])
    }

    const surveyTitleSelector = getSelector(TestId.header.surveyTitle)
    await expect(await page.innerText(surveyTitleSelector)).toBe(`${label} [${name}]`)
  })
}
