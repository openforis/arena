import * as JobManager from '@server/job/jobManager'

import ArenaImportJob from './arenaImport/arenaImportJob'

// COLLECT SURVEY IMPORT
export const startArenaImportJob = (user, filePath) => {
  const job = new ArenaImportJob({ user, filePath })

  JobManager.executeJobThread(job)

  return job
}
