import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

const keys = {
  oldPassword: 'oldPassword',
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
}

const newForm = () => Object.values(keys).reduce((acc, key) => ({ ...acc, [key]: '' }), {})
const isEmpty = (form) => Object.values(keys).every((key) => Objects.isEmpty(form[key]))

const getOldPassword = A.propOr('', keys.oldPassword)
const getNewPassword = A.propOr('', keys.newPassword)

export const UserPasswordChangeForm = {
  keys,
  newForm,
  isEmpty,
  getOldPassword,
  getNewPassword,
}
