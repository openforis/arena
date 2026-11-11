import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import UsersBackupExportJob from './UsersBackupExportJob'
import UsersBackupImportJob from './UsersBackupImportJob'
import { UsersBackupFileReader } from './usersBackupFileReader'
import { buildUsersBackupPreviewUsers } from './usersBackupPreviewBuilder'
import { UsersBackupPreview, UsersBackupUserAction } from './usersBackupModel'

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

// Copies the uploaded backup into the temp folder (kept until the import is started or canceled)
// and returns, for every user in it, if it already exists in this server.
const readImportPreview = async ({ uploadedFilePath }: { uploadedFilePath: string }): Promise<UsersBackupPreview> => {
  const tempFileName = FileUtils.newTempFileName()
  const filePath = FileUtils.tempFilePath(tempFileName)
  await FileUtils.copyFile(uploadedFilePath, filePath)
  await FileUtils.deleteFileAsync(uploadedFilePath)
  let fileZip = null
  try {
    fileZip = await UsersBackupFileReader.open(filePath)
    const { serverUrl, dateExported, exportedByUserEmail, includePasswords } = UsersBackupFileReader.readInfo(fileZip)
    const users = UsersBackupFileReader.readUsers(fileZip)
    return {
      tempFileName,
      info: { serverUrl, dateExported, exportedByUserEmail, includePasswords },
      users: await buildUsersBackupPreviewUsers(users),
    }
  } catch (error) {
    await FileUtils.deleteFileAsync(filePath)
    throw error
  } finally {
    fileZip?.close()
  }
}

const startImportJob = ({
  user,
  tempFileName,
  actionsByEmail = {},
  restorePasswordEmails = null,
}: {
  user: any
  tempFileName: string
  actionsByEmail?: Record<string, UsersBackupUserAction>
  // when null, all the passwords in the backup are restored
  restorePasswordEmails?: string[] | null
}) => {
  FileUtils.checkIsValidTempFileName(tempFileName)
  const validActions = Object.values(UsersBackupUserAction)
  const invalidAction = Object.values(actionsByEmail).find((action) => !validActions.includes(action))
  if (invalidAction) {
    throw new Error(`Invalid user action: ${invalidAction}`)
  }
  const filePath = FileUtils.tempFilePath(tempFileName)
  const job = new UsersBackupImportJob({ user, filePath, actionsByEmail, restorePasswordEmails })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

const cancelImport = async ({ tempFileName }: { tempFileName: string }) => {
  FileUtils.checkIsValidTempFileName(tempFileName)
  await FileUtils.deleteFileAsync(FileUtils.tempFilePath(tempFileName))
}

export const UsersBackupService = {
  startExportJob,
  readImportPreview,
  startImportJob,
  cancelImport,
}
