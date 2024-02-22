import * as R from 'ramda'

import * as Validation from '@core/validation/validation'

export const keys = {
  email: 'email',
  emails: 'emails',
  groupUuid: 'groupUuid',
  message: 'message',
}

// ===== CREATE
export const newUserGroupInvitation = (email, groupUuid) => ({
  [keys.emails]: [email],
  [keys.groupUuid]: groupUuid,
})

// ===== READ
export const getEmail = R.propOr('', keys.email)
export const getEmails = R.propOr([], keys.emails)
export const getGroupUuid = R.prop(keys.groupUuid)
export const getMessage = R.propOr('', keys.message)
export const { getValidation } = Validation

// ===== UPDATE
export const assocProp = R.assoc
export const { assocValidation } = Validation
