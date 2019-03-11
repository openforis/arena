const R = require('ramda')

const { isDateBefore } = require('../../../../../common/dateUtils')

const recordUserIdsMap = new Map()
const previewRecordsMap = new Map()

const getUserIds = recordUuid =>
  R.defaultTo(
    [],
    recordUserIdsMap.get(recordUuid)
  )

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

const getStalePreviewRecordUuids = olderThan => {
  const array = []
  for (const [recordUuid, { date, surveyId, user }] of previewRecordsMap.entries()) {
    if (isDateBefore(date, olderThan))
      array.push({ recordUuid, surveyId, user })
  }
  return array
}

module.exports = {
  getUserIds,

  assocUser,
  dissocUserId,

  touchPreviewRecord,
  getStalePreviewRecordUuids,
}