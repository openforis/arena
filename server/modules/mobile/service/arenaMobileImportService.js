import * as JobManager from '@server/job/jobManager'

import ArenaMobileImportJob from './arenaMobileImport/arenaMobileImportJob'

// ARENA SURVEY IMPORT
export const startArenaMobileImportJob = ({ user, filePath, survey, surveyId }) => {
  const job = new ArenaMobileImportJob({ user, filePath, survey, surveyId })

  JobManager.executeJobThread(job)

  return job
}
