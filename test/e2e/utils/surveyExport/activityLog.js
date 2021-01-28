import path from 'path'
import * as ActivityLog from '@common/activityLog/activityLog'

import { checkFileAndGetContent } from './utils'

export const checkActivityLog = async ({ surveyExtractedPath }) => {
  const activityLog = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'activitylog', 'activitylog.json'),
  })

  const activitiesAsArray = Object.values(activityLog)

  await expect(activitiesAsArray.length).toBeGreaterThan(1)

  const [lastActivity] = activitiesAsArray.reverse()
  await expect(ActivityLog.getType(lastActivity)).toBe(ActivityLog.type.surveyCreate)
}
