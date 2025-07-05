import * as JobManager from '@server/job/jobManager'

import { GeoJsonDataExportJob } from './GeoJsonDataExportJob'

const startGeoJsonCoordinateFeaturesGenerationJob = ({ user, surveyId, cycle, attributeDefUuid }) => {
  const job = new GeoJsonDataExportJob({ user, surveyId, cycle, attributeDefUuid })
  return JobManager.enqueueJob(job)
}

export const GeoService = {
  startGeoJsonCoordinateFeaturesGenerationJob,
}
