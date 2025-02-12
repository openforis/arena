import * as JobManager from '@server/job/jobManager'

import ArenaImportJob from './arenaImport/arenaImportJob'

// ARENA SURVEY IMPORT
export const startArenaImportJob = async ({ user, filePath, surveyInfoTarget, options }) => {
  const job = new ArenaImportJob({ user, filePath, surveyInfoTarget, options })
  await JobManager.enqueueJob(job)
  return job
}
