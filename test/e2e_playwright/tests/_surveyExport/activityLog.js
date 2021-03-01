import { getSurveyEntry } from '../../downloads/path'

export const verifyActivityLog = (survey) =>
  test('Verify activity log', async () => {
    const activityLog = getSurveyEntry(survey, 'activitylog', 'activitylog.json')

    const activities = Object.values(activityLog)

    await expect(activities.length).toBeGreaterThan(1)

    const [lastActivity] = activities.reverse()
    await expect(lastActivity.type).toBe('surveyCreate')
  })
