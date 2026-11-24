import type { ArenaUser } from '@openforis/arena-core'

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
const getDeviceName = (device: Record<string, unknown>): string => (device[keys.deviceName] as string | undefined) ?? ''
const isEnabled = (device: Record<string, unknown>): boolean => Boolean(device[keys.enabled] ?? false)
const getStringOrNull = (device: Record<string, unknown>, key: string): string | null =>
  (device[key] as string | undefined) ?? null
const getDateCreated = (device: Record<string, unknown>): string | null => getStringOrNull(device, keys.dateCreated)
const getDateModified = (device: Record<string, unknown>): string | null => getStringOrNull(device, keys.dateModified)
const getSecret = (device: Record<string, unknown>): string | null => getStringOrNull(device, keys.secret)
const getOtpAuthUrl = (device: Record<string, unknown>): string | null => getStringOrNull(device, keys.otpAuthUrl)
const getBackupCodes = (device: Record<string, unknown>): string[] => (device[keys.backupCodes] as string[]) ?? []

const getDeviceNameFinal =
  ({ user }: { user: ArenaUser }) =>
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
