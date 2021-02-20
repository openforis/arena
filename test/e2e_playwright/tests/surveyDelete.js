import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoSurveyList } from './_navigation'

const deleteSurvey = (name, idx) =>
  test(`Delete ${name}`, async () => {
    await Promise.all([
      page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
      page.click(getSelector(DataTestId.surveyList.surveyRow(idx))),
    ])

    await page.click(getSelector(DataTestId.dashboard.surveyDeleteBtn, 'button'))
    await page.fill('input[type="text"]', name)

    // Click div[role="dialog"] >> text="Delete"
    await Promise.all([
      page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/surveys/' } */),
      page.click('div[role="dialog"] >> text="Delete"'),
    ])

    await expect(page).toHaveText(`Survey ${name} has been deleted`)
  })

export default () =>
  describe('Survey Delete', () => {
    gotoSurveyList()

    deleteSurvey('survey_2', 1)

    deleteSurvey('survey', 0)
  })
