import type { ArenaSurvey, ArenaUser } from '@openforis/arena-core'

import * as JobManager from '@server/job/jobManager'

import ArenaImportJob from './arenaImport/arenaImportJob'

// ARENA SURVEY IMPORT
export const startArenaImportJob = ({
  user,
  filePath,
  fileId,
  totalChunks,
  totalFileSize,
  surveyInfoTarget,
  options,
}: {
  user: ArenaUser
  filePath?: string
  fileId?: string
  totalChunks?: number
  totalFileSize?: number
  surveyInfoTarget: ArenaSurvey
  options: { includeData?: boolean }
}) => {
  const job = new ArenaImportJob({
    user,
    filePath,
    fileId,
    totalChunks,
    totalFileSize,
    surveyInfoTarget,
    options,
  })

  JobManager.enqueueJob(job)

  return job
}
