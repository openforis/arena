import * as PromiseUtils from '../../../core/promiseUtils'
import { TestId, getSelector } from '../../../webapp/utils/testId'
import { survey, survey2, surveyFromTemplate, surveyImport } from '../mock/survey'
import { gotoSurveyList } from './_navigation'
import { clickSurvey } from './_surveyList'
import { expectNoItems } from './_tables'

const deleteSurvey = async (surveyToDelete) => {
  const { name } = surveyToDelete

  await clickSurvey(surveyToDelete)

  await page.click(getSelector(TestId.dashboard.advancedFunctionsBtn, 'button'))

  const modalSelector = getSelector(TestId.modal.modal)

  await Promise.all([
    page.waitForSelector(modalSelector),
    page.click(getSelector(TestId.dashboard.surveyDeleteBtn, 'button')),
  ])

  await page.fill(getSelector(TestId.dialogConfirm.strongConfirmInput), name)

  await Promise.all([
    page.waitForNavigation(/* { url: `{BASE_URL}/app/home/surveys/` } */),
    page.click(`${modalSelector} >> text="Delete"`),
  ])

  await expect(page).toHaveText(`Survey ${name} has been deleted`)
}

export default () =>
  describe('Survey Delete', () => {
    gotoSurveyList()

    test('Delete surveys', async () => {
      await PromiseUtils.each([survey2, surveyImport, surveyFromTemplate, survey], deleteSurvey)
    }, 30000)

    test('Verify survey list empty', async () => {
      await expectNoItems()
    })
  })
