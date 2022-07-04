import * as JobManager from '@server/job/jobManager'

import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = ({ user, filePath, survey, surveyId }) => {
  const job = new ArenaImportJob({ user, filePath, survey, surveyId })

  JobManager.executeJobThread(job)

  return job
}
