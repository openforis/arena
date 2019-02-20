const R = require('ramda')

const recordUserIdsMap = new Map()
const previewRecordsMap = new Map()

const getUserIds = recordUuid =>
  R.defaultTo(
    [],
    recordUserIdsMap.get(recordUuid)
  )

const getRecordUuids = () => recordUserIdsMap.keys()

const assocUser = (surveyId, recordUuid, user, preview) => {
  if (!recordUserIdsMap.has(recordUuid))
    recordUserIdsMap.set(recordUuid, new Set())

  getUserIds(recordUuid).add(user.id)

  if (preview) {
    previewRecordsMap.set(recordUuid, { user, surveyId, date: new Date() })
  }
}

const dissocUserId = (recordUuid, userId) => {
  const userIds = getUserIds(recordUuid)

  userIds.delete(userId)

  if (userIds.size === 0) {
    recordUserIdsMap.delete(recordUuid)
    previewRecordsMap.delete(recordUuid)
  }
}

const touchPreviewRecord = recordUuid => {
  const previewData = previewRecordsMap.get(recordUuid)
  previewRecordsMap.set(recordUuid, { ...previewData, date: new Date() })
}

const getStalePreviewRecordUuids = olderThan =>
  Array.from(previewRecordsMap.entries())
    .filter(([_, { date }]) => date < olderThan)
    .map(([recordUuid, { surveyId, user }]) => ({ surveyId, recordUuid, user }))

// module.exports = RecordUsersMap
module.exports = {
  getUserIds,
  getRecordUuids,

  assocUser,
  dissocUserId,

  touchPreviewRecord,
  getStalePreviewRecordUuids,
}