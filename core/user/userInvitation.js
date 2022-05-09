import * as A from '@core/arena'

const keys = {
  userUuid: 'userUuid',
  surveyUuid: 'surveyUuid',
  invitedBy: 'invitedBy',
  invitedDate: 'invitedDate',
  removedDate: 'removedDate',
}

const getRemovedDate = A.prop(keys.removedDate)

const hasBeenRemoved = (userInvitation) => {
  const removedDate = getRemovedDate(userInvitation)
  return Boolean(removedDate)
}

export const UserInvitation = {
  keys,
  hasBeenRemoved,
}
