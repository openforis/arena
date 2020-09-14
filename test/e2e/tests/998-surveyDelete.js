import { click, clickParent, getElement, writeIntoTextBox } from '../utils/api'
import { clickHeaderBtnMySurveys, waitForLoader } from '../utils/ui'

const deleteSurvey = async ({ name, label }) => {
  await waitForLoader()
  await clickHeaderBtnMySurveys()
  await clickParent(label)

  await waitForLoader()
  await click('Delete')

  await waitForLoader()
  await writeIntoTextBox({ text: name, selector: { class: 'confirm-name' } })
  await click(await getElement({ selector: '.btn-danger' }))

  await waitForLoader()
}

describe('Survey delete', () => {
  test('delete a survey with name "survey_2" and label "Survey 2"', async () => {
    await deleteSurvey({ name: 'survey_2', label: 'Survey 2' })
  })
  test('delete a survey with name "survey" and label "Survey"', async () => {
    await deleteSurvey({ name: 'survey', label: 'Survey' })
  })
})
