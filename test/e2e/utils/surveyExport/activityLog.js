import path from 'path'

import { checkFileAndGetContent } from './utils'

export const checkActivityLog = async ({ surveyExtractedPath }) => {
  const activityLog = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'activitylog', 'activitylog.json'),
  })

  const activitiesAsArray = Object.values(activityLog)

  await expect(activitiesAsArray.length).toBeGreaterThan(1)

  const [lastActivity] = activitiesAsArray.reverse()
  await expect(lastActivity.type).toBe('surveyCreate')
}
