import { getSurveyEntry } from '../../paths'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'

export const verifyActivityLog = (survey) =>
  test('Verify activity log', async () => {
    const activityLog = getSurveyEntry(survey, ExportFile.activityLog)

    const activities = Object.values(activityLog)

    await expect(activities.length).toBeGreaterThanOrEqual(1)

    const [mostRecentActivity] = activities
    await expect(mostRecentActivity.type).toBe('surveyCreate')
  })
