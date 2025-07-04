import * as JobManager from '@server/job/jobManager'

import { GeoJsonCoordinateFeaturesGenerationJob } from './GeoJsonCoordinateFeaturesGenerationJob'

const startGeoJsonCoordinateFeaturesGenerationJob = ({ user, surveyId, cycle, attributeDefUuid }) => {
  const job = new GeoJsonCoordinateFeaturesGenerationJob({ user, surveyId, cycle, attributeDefUuid })
  return JobManager.enqueueJob(job)
}

export const GeoService = {
  startGeoJsonCoordinateFeaturesGenerationJob,
}
