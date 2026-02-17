import axios from 'axios'

export const getDevices = async () => {
  const { data } = await axios.get('/api/2fa/devices')
  return data.list
}

export const getDevice = async (deviceUuid) => {
  const { data } = await axios.get(`/api/2fa/device/${deviceUuid}`)
  return data
}

export const addDevice = async ({ deviceName }) => {
  const { data } = await axios.post('/api/2fa/device/add', { deviceName })
  return data
}

export const verifyDevice = async ({ deviceUuid, token1, token2 }) => {
  await axios.post(`/api/2fa/device/${deviceUuid}/verify`, { token1, token2 })
}

export const regenerateBackupCodes = async ({ deviceUuid }) => {
  const { data } = await axios.post(`/api/2fa/device/${deviceUuid}/regenerate-backup-codes`)
  return data.backupCodes
}

export const removeDevice = async (deviceUuid) => {
  await axios.delete(`/api/2fa/device/${deviceUuid}/remove`)
}
