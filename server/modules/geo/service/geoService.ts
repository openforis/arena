import type { User as ArenaUser } from '@openforis/arena-core'
import * as JobManager from '@server/job/jobManager'

import { GeoJsonDataExportJob } from './GeoJsonDataExportJob'
import SamplingPointDataWhispJob from './whispSamplingPointData/SamplingPointDataWhispJob'

const startGeoJsonCoordinateFeaturesGenerationJob = ({
  user,
  surveyId,
  cycle,
  attributeDefUuid,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  attributeDefUuid: string
}) => {
  const job = new GeoJsonDataExportJob({ user, surveyId, cycle, attributeDefUuid })
  return JobManager.enqueueJob(job)
}

const startSamplingPointDataWhispJob = ({ user, surveyId }: { user: ArenaUser; surveyId: number }) => {
  const job = new SamplingPointDataWhispJob({ user, surveyId })
  return JobManager.enqueueJob(job)
}

export const GeoService = {
  startGeoJsonCoordinateFeaturesGenerationJob,
  startSamplingPointDataWhispJob,
}
