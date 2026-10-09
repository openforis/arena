import axios from 'axios'

import { objectToFormData } from '../utils/apiUtils'

export const startUsersBackupExport = async ({ includePasswords }: { includePasswords: boolean }) => {
  const {
    data: { job },
  } = await axios.post('/api/users/backup/export', { includePasswords })
  return job
}

export const getUsersBackupDownloadUrl = ({ tempFileName }: { tempFileName: string }) =>
  `/api/users/backup/export/download?${new URLSearchParams({ tempFileName })}`

export const startUsersBackupImport = async ({
  file,
  conflictMode,
  dryRun,
}: {
  file: File
  conflictMode: string
  dryRun: boolean
}) => {
  const formData = objectToFormData({ file, conflictMode, dryRun })
  const {
    data: { job },
  } = await axios.post('/api/users/backup/import', formData)
  return job
}
