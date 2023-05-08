import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  email: 'email',
  groupUuid: 'groupUuid',
  inviteAsSurveyManager: 'inviteAsSurveyManager',
  message: 'message',
}

// ===== CREATE
export const newUserGroupInvitation = (email, groupUuid) => ({
  [keys.email]: email,
  [keys.groupUuid]: groupUuid,
})

// ===== READ
export const getEmail = A.propOr('', keys.email)
export const isInviteAsSurveyManager = ObjectUtils.isKeyTrue(keys.inviteAsSurveyManager)
export const getGroupUuid = A.prop(keys.groupUuid)
export const getMessage = A.propOr('', keys.message)
export const { getValidation } = Validation

// ===== UPDATE
export const assocProp = A.assoc
export const { assocValidation } = Validation
