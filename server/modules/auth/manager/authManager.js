const db = require('../../../db/db')

const AuthGroupRepository = require('../repository/authGroupRepository')
const JwtRepository = require('../repository/jwtRepository')

const ActivityLog = require('../../activityLog/activityLogger')

const addUserToGroup = async (user, surveyId, groupId, newUserId, client = db) =>
  await client.tx(async t => {
    await AuthGroupRepository.insertUserGroup(groupId, newUserId, t)
    await ActivityLog.log(user, surveyId, ActivityLog.type.userInvite, { groupId, userId: newUserId }, t)
  })

module.exports = {
  addUserToGroup,

  fetchGroupById: AuthGroupRepository.fetchGroupById,

  fetchUserGroups: AuthGroupRepository.fetchUserGroups,

  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
}