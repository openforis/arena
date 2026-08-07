import { TestId, getSelector } from '../../../../webapp/utils/testId'
import { FormUtils } from '../utils/formUtils'
import { gotoSurveyCreate } from '../_navigation'

export const createSurvey = (surveyToAdd) => {
  gotoSurveyCreate()

  test(`Create Survey ${surveyToAdd.name}`, async () => {
    const { cloneFrom, cloneFromLabel, label, name } = surveyToAdd

    await FormUtils.fillInput(TestId.surveyCreate.surveyName, name)

    if (cloneFrom) {
      // select create type "clone"
      await page.click(getSelector(TestId.surveyCreate.createTypeBtn({ prefix: 'surveyCreateType', type: 'clone' })))

      // set survey 'Clone from' field
      await FormUtils.selectDropdownItem({
        testId: TestId.surveyCreate.surveyCloneFrom,
        label: `${cloneFrom} - ${cloneFromLabel}`,
      })
    } else {
      await FormUtils.fillInput(TestId.surveyCreate.surveyLabel, label)
    }

    // press "Create survey" and wait for the job to complete (survey creation runs as a job too, to bound concurrency)
    await page.click(getSelector(TestId.surveyCreate.submitBtn, 'button'))
    await page.waitForSelector(getSelector(TestId.modal.modal))

    // close the job dialog and wait for the navigation to the survey dashboard
    await Promise.all([
      page.waitForNavigation(/* { url: `{BASE_URL}/app/home/landing/` } */),
      page.click(TestId.modal.close),
    ])

    const surveyTitleSelector = getSelector(TestId.header.surveyTitle)
    await expect(await page.innerText(surveyTitleSelector)).toBe(`${label} [${name}]`)
  })
}
