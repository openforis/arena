import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'

import UsersBackupExportJob from './UsersBackupExportJob'
import UsersBackupImportJob from './UsersBackupImportJob'
import { UsersBackupConflictMode } from './usersBackupModel'

const startExportJob = ({
  user,
  includePasswords = true,
  serverUrl,
}: {
  user: any
  includePasswords?: boolean
  serverUrl: string
}) => {
  const job = new UsersBackupExportJob({ user, includePasswords, serverUrl })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

const startImportJob = ({
  user,
  filePath,
  conflictMode = UsersBackupConflictMode.skip,
  dryRun = false,
}: {
  user: any
  filePath: string
  conflictMode?: UsersBackupConflictMode
  dryRun?: boolean
}) => {
  if (!Object.values(UsersBackupConflictMode).includes(conflictMode)) {
    throw new Error(`Invalid conflict mode: ${conflictMode}`)
  }
  const job = new UsersBackupImportJob({ user, filePath, conflictMode, dryRun })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

export const UsersBackupService = {
  startExportJob,
  startImportJob,
}
