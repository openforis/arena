import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'

export const keys = {
  email: 'email',
  emails: 'emails',
  groupUuid: 'groupUuid',
  message: 'message',
} as const

// invitation of users (by email) to join a survey auth group
export type UserGroupInvitation = {
  emails: string[]
  groupUuid: string
  message?: string
}

// ===== CREATE
export const newUserGroupInvitation = (email: string, groupUuid: string) => ({
  [keys.emails]: [email],
  [keys.groupUuid]: groupUuid,
})

// ===== READ
export const getEmails = A.propOr([], keys.emails)
export const getGroupUuid = A.prop(keys.groupUuid)
export const getMessage = A.propOr('', keys.message)
export const { getValidation } = Validation

// ===== UPDATE
export const assocProp = A.assoc
export const { assocValidation } = Validation

// ===== UTILS
export const getEmail = A.pipe(getEmails, A.head, A.defaultTo(''))
export const getEmailsJoint = A.pipe(getEmails, A.join(', '))
