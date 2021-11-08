import * as JobManager from '@server/job/jobManager'

import ArenaImportJob from './arenaImport/arenaImportJob'

// ARENA SURVEY IMPORT
export const startArenaImportJob = ({ user, filePath, surveyInfoTarget }) => {
  const job = new ArenaImportJob({ user, filePath, surveyInfoTarget })

  JobManager.executeJobThread(job)

  return job
}
