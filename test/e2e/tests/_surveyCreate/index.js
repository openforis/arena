import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { gotoSurveyCreate } from '../_navigation'

export const createSurvey = (surveyToAdd) => {
  gotoSurveyCreate()

  test(`Create Survey ${surveyToAdd.name}`, async () => {
    const { cloneFrom, cloneFromLabel, label, name } = surveyToAdd

    await page.fill(getSelector(TestId.surveyCreate.surveyName, 'input'), name)

    if (cloneFrom) {
      // select create type "clone"
      await page.click(getSelector(TestId.surveyCreate.createTypeBtn({ prefix: 'surveyCreateType', type: 'clone' })))

      // set survey 'Clone from' field
      await FormUtils.selectDropdownItem({
        testId: TestId.surveyCreate.surveyCloneFrom,
        label: `${cloneFrom} - ${cloneFromLabel}`,
      })

      // press "Create survey" and wait for the job to complete
      await page.click(getSelector(TestId.surveyCreate.submitBtn, 'button'))
      await page.waitForSelector(getSelector(TestId.modal.modal))

      // close the job dialog and wait fot the navigation to the survey dashboard
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(TestId.modal.close),
      ])
    } else {
      await page.fill(getSelector(TestId.surveyCreate.surveyLabel, 'input'), label)

      // press "Create survey" and wait for the navigation to the survey dashboard
      await Promise.all([
        page.waitForNavigation(/* { url: `{BASE_URL}/app/home/dashboard/` } */),
        page.click(getSelector(TestId.surveyCreate.submitBtn, 'button')),
      ])
    }

    const surveyTitleSelector = getSelector(TestId.header.surveyTitle)
    await expect(await page.innerText(surveyTitleSelector)).toBe(`${label} [${name}]`)
  })
}
