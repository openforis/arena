const keys = {
  userUuid: 'userUuid',
  surveyUuid: 'surveyUuid',
  invitedBy: 'invitedBy',
  invitedDate: 'invitedDate',
  removedDate: 'removedDate',
} as const

const getUserUuid = (userInvitation: Record<string, unknown>) => userInvitation[keys.userUuid]
const getInvitedBy = (userInvitation: Record<string, unknown>) => userInvitation[keys.invitedBy]
const getRemovedDate = (userInvitation: Record<string, unknown>) => userInvitation[keys.removedDate]

const hasBeenRemoved = (userInvitation: Record<string, unknown>): boolean => {
  const removedDate = getRemovedDate(userInvitation)
  return Boolean(removedDate)
}

export const UserInvitation = {
  keys,
  getUserUuid,
  getInvitedBy,
  hasBeenRemoved,
}
