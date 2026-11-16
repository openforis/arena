import * as UserInvitationRepository from '@server/modules/user/repository/userInvitationRepository'

export const {
  insertUserInvitation,
  updateRemovedDate,
  fetchUserInvitationBySurveyAndUserUuid,
  fetchUserInvitationsBySurveyUuid,
  existsUserInvitationInOtherSurveys,
  deleteUserInvitation,
  deleteExpiredInvitations,
} = UserInvitationRepository
