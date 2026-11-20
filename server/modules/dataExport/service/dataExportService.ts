import type { ArenaUser } from '@openforis/arena-core'
import * as JobManager from '@server/job/jobManager'
import DataExportJob from './dataExportJob'
import DataMatrixExportJob from './DataMatrixExportJob'
import DataSummaryExportJob from './DataSummaryExportJob'

export const startCsvDataExportJob = ({
  user,
  surveyId,
  cycle,
  recordUuids,
  search,
  options,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  recordUuids: string[]
  search: string | null
  options: any
}) => {
  const job = new DataExportJob({ user, surveyId, cycle, recordUuids, search, options })
  JobManager.enqueueJob(job)
  return job
}

export const startDataMatrixExportJob = ({
  user,
  surveyId,
  cycle,
  options,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  options: any
}) => {
  const job = new DataMatrixExportJob({ user, surveyId, cycle, options })
  JobManager.enqueueJob(job)
  return job
}

export const startDataSummaryExportJob = ({
  user,
  surveyId,
  cycle,
  lang,
  options,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  lang: string
  options: any
}) => {
  const job = new DataSummaryExportJob({ user, surveyId, cycle, lang, options })
  JobManager.enqueueJob(job)
  return job
}
