import * as A from '@core/arena'

const keys = {
  userUuid: 'userUuid',
  surveyUuid: 'surveyUuid',
  invitedBy: 'invitedBy',
  invitedDate: 'invitedDate',
  removedDate: 'removedDate',
}

const getUserUuid = A.prop(keys.userUuid)
const getInvitedBy = A.prop(keys.invitedBy)
const getRemovedDate = A.prop(keys.removedDate)

const hasBeenRemoved = (userInvitation) => {
  const removedDate = getRemovedDate(userInvitation)
  return Boolean(removedDate)
}

export const UserInvitation = {
  keys,
  getUserUuid,
  getInvitedBy,
  hasBeenRemoved,
}
