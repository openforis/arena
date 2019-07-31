const db = require('../../../db/db')

const AuthGroupRepository = require('../repository/authGroupRepository')
const JwtRepository = require('../repository/jwtRepository')

const ActivityLog = require('../../activityLog/activityLogger')

const insertUserGroup = async (user, surveyId, groupId, newUserId, client = db) =>
  client.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.userGroupInsert, { groupId, userId: newUserId }, t)
    await AuthGroupRepository.insertUserGroup(groupId, newUserId, t)
  })

module.exports = {
  insertUserGroup,

  fetchUserGroups: AuthGroupRepository.fetchUserGroups,

  blacklistToken: JwtRepository.blacklistToken,

  findBlacklistedToken: JwtRepository.findBlacklistedToken,

  deleteExpiredJwtTokens: JwtRepository.deleteExpiredJwtTokens,
}