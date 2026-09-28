import { expect, test } from '../fixtures'
import { deleteCurrentSurvey } from '../helpers/dashboard'

test.describe('Survey delete', () => {
  test('deletes the current survey from the dashboard', async ({ page, survey, api }) => {
    await deleteCurrentSurvey(page, survey.name)

    await expect(page).toHaveURL(/\/app\/home\/surveys\/$/)
    expect(await api.findSurveyIdByName({ name: survey.name })).toBeNull()
  })
})
