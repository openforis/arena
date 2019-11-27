import { db } from '@server/db/db'

import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'

export const publishSurvey = async (user, surveyId, client = db) => {
  const publishJob = new SurveyPublishJob({ user, surveyId })
  await publishJob.start(client)
  if (publishJob.isFailed()) {
    throw new Error(`Survey publish failed: ${JSON.stringify(publishJob)}`)
  }
}
