import { deleteSurvey } from '../utils/ui/deleteSurvey'

describe('Survey delete', () => {
  test('delete a survey with name "survey_2" and label "Survey 2"', async () => {
    await deleteSurvey({ name: 'survey_2', label: 'Survey 2' })
  })
  test('delete a survey with name "survey" and label "Survey"', async () => {
    await deleteSurvey({ name: 'survey', label: 'Survey' })
  })
})
