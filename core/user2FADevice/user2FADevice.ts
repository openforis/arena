import * as User from '@core/user/user'

const keys = {
  deviceName: 'deviceName',
  enabled: 'enabled',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  secret: 'secret',
  otpAuthUrl: 'otpAuthUrl',
  backupCodes: 'backupCodes',
  uuid: 'uuid',
} as const

const getUuid = (device: Record<string, unknown>): string | undefined => device[keys.uuid] as string | undefined
const getDeviceName = (device: Record<string, unknown>): string => String(device[keys.deviceName] ?? '')
const isEnabled = (device: Record<string, unknown>): boolean => Boolean(device[keys.enabled] ?? false)
const getDateCreated = (device: Record<string, unknown>): unknown => device[keys.dateCreated] ?? null
const getDateModified = (device: Record<string, unknown>): unknown => device[keys.dateModified] ?? null
const getSecret = (device: Record<string, unknown>): unknown => device[keys.secret] ?? null
const getOtpAuthUrl = (device: Record<string, unknown>): unknown => device[keys.otpAuthUrl] ?? null
const getBackupCodes = (device: Record<string, unknown>): Array<unknown> =>
  (device[keys.backupCodes] as Array<unknown>) ?? []

const getDeviceNameFinal =
  ({ user }: { user: Record<string, unknown> }) =>
  (device: Record<string, unknown>): string =>
    `Arena: ${getDeviceName(device)} - ${User.getEmail(user)}`

export const User2FADevice = {
  keys,
  getUuid,
  getDeviceName,
  isEnabled,
  getDateCreated,
  getDateModified,
  getSecret,
  getOtpAuthUrl,
  getBackupCodes,
  getDeviceNameFinal,
}
