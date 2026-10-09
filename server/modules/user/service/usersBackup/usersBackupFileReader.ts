import SystemError from '@core/systemError'

import FileZip from '@server/utils/file/fileZip'

import {
  UsersBackupFile,
  UsersBackupInfo,
  UsersBackupUser,
  usersBackupFormatVersion,
  usersBackupType,
} from './usersBackupModel'

const readJsonEntry = (fileZip: any, entryName: string) => {
  const content = fileZip.getEntryAsText(entryName)
  return content ? JSON.parse(content) : null
}

// Opens a users backup zip file; it throws an error if the file is not a valid users backup.
const open = async (filePath: string): Promise<any> => {
  const fileZip = new FileZip(filePath)
  try {
    await fileZip.init()
  } catch {
    throw new SystemError('usersBackupImport.invalidFile')
  }
  const info: UsersBackupInfo | null = readJsonEntry(fileZip, UsersBackupFile.info)
  if (info?.type !== usersBackupType || info.formatVersion !== usersBackupFormatVersion) {
    fileZip.close()
    throw new SystemError('usersBackupImport.invalidFile')
  }
  return fileZip
}

const readInfo = (fileZip: any): UsersBackupInfo => readJsonEntry(fileZip, UsersBackupFile.info)

const readUsers = (fileZip: any): UsersBackupUser[] => readJsonEntry(fileZip, UsersBackupFile.users) ?? []

const readProfilePicture = (fileZip: any, userUuid: string): Buffer | null =>
  fileZip.getEntryData(UsersBackupFile.profilePicture({ userUuid }))

export const UsersBackupFileReader = {
  open,
  readInfo,
  readUsers,
  readProfilePicture,
}
