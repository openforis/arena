const R = require('ramda')

const recordUserIdsMap = new Map()

const getUserIds = recordUuid => R.defaultTo(
  [],
  recordUserIdsMap.get(recordUuid)
)

const getRecordUuids = recordUserIdsMap.keys

const assocUserId = (recordUuid, userId) => {
  if (!recordUserIdsMap.has(recordUuid))
    recordUserIdsMap.set(recordUuid, new Set())

  getUserIds(recordUuid).add(userId)
}

const dissocUserId = (recordUuid, userId) => {
  const userIds = getUserIds(recordUuid)

  userIds.delete(userId)

  if (userIds.size === 0)
    recordUserIdsMap.delete(recordUuid)
}

module.exports = {
  getUserIds,
  getRecordUuids,

  assocUserId,
  dissocUserId,
}