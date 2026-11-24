import type { ArenaUser } from '@openforis/arena-core'
import * as JobManager from '@server/job/jobManager'
import DataExportJob from './dataExportJob'
import DataMatrixExportJob from './dataMatrixExportJob'
import DataSummaryExportJob from './dataSummaryExportJob'
import type { DataExportOptions, DataMatrixExportOptions } from '@server/modules/surveyRdb/manager/dataExportOptions'

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
  options: DataExportOptions & { includeCategories?: boolean }
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
  options: DataMatrixExportOptions
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
  options: DataExportOptions
}) => {
  const job = new DataSummaryExportJob({ user, surveyId, cycle, lang, options })
  JobManager.enqueueJob(job)
  return job
}
