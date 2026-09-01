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
