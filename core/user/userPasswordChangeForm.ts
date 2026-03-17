import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

const keys = {
  oldPassword: 'oldPassword',
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
  userUuid: 'userUuid',
} as const

const newForm = () => Object.values(keys).reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: '' }), {})
const isEmpty = (form: Record<string, unknown>) => Object.values(keys).every((key) => Objects.isEmpty(form[key]))

const getOldPassword = A.propOr('', keys.oldPassword)
const getNewPassword = A.propOr('', keys.newPassword)
const getUserUuid = A.prop(keys.userUuid)

export const UserPasswordChangeForm = {
  keys,
  newForm,
  isEmpty,
  getOldPassword,
  getNewPassword,
  getUserUuid,
}
