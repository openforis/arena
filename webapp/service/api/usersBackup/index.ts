import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

// emails: when null, all the users are exported
export const startUsersBackupExport = async ({
  includePasswords,
  emails = null,
}: {
  includePasswords: boolean
  emails?: string[] | null
}) => {
  const {
    data: { job },
  } = await axios.post('/api/users/backup/export', { includePasswords, emails })
  return job
}

export const getUsersBackupDownloadUrl = ({ tempFileName }: { tempFileName: string }) =>
  `/api/users/backup/export/download?${new URLSearchParams({ tempFileName })}`

export const readUsersBackupImportPreview = async ({ file }: { file: File }) => {
  const { data } = await axios.post('/api/users/backup/import/preview', objectToFormData({ file }))
  return data
}

export const startUsersBackupImport = async ({
  tempFileName,
  actionsByEmail,
  restorePasswordEmails,
}: {
  tempFileName: string
  actionsByEmail: Record<string, string>
  restorePasswordEmails: string[]
}) => {
  const {
    data: { job },
  } = await axios.post('/api/users/backup/import', { tempFileName, actionsByEmail, restorePasswordEmails })
  return job
}

export const cancelUsersBackupImport = ({ tempFileName }: { tempFileName: string }) =>
  axios.post('/api/users/backup/import/cancel', { tempFileName })
