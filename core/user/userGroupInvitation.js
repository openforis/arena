import * as R from 'ramda'

import * as Validation from '@core/validation/validation'

export const keys = {
  email: 'email',
  groupUuid: 'groupUuid',
}

// ===== CREATE
export const newUserGroupInvitation = (email, groupUuid) => ({
  [keys.email]: email,
  [keys.groupUuid]: groupUuid,
})

// ===== READ
export const getEmail = R.propOr('', keys.email)
export const getGroupUuid = R.prop(keys.groupUuid)
export const { getValidation } = Validation

// ===== UPDATE
export const assocProp = R.assoc
export const { assocValidation } = Validation
