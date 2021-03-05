import { getSurveyEntry } from '../../downloads/path'

export const verifyActivityLog = (survey) =>
  test('Verify activity log', async () => {
    const activityLog = getSurveyEntry(survey, 'activitylog', 'activitylog.json')

    const activities = Object.values(activityLog)

    await expect(activities.length).toBeGreaterThanOrEqual(1)

    const [mostRecentActivity] = activities
    await expect(mostRecentActivity.type).toBe('surveyCreate')
  })
