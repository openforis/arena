const R = require('ramda')

const User = require('../../../../../common/user/user')
const { isDateBefore } = require('../../../../../common/dateUtils')

const recordUserUuidsMap = new Map()
const previewRecordsMap = new Map()

const getUserUuids = recordUuid =>
  R.defaultTo(
    [],
    recordUserUuidsMap.get(recordUuid)
  )

const assocUser = (surveyId, recordUuid, user, preview) => {
  if (!recordUserUuidsMap.has(recordUuid))
    recordUserUuidsMap.set(recordUuid, new Set())

  getUserUuids(recordUuid).add(User.getUuid(user))

  if (preview) {
    previewRecordsMap.set(recordUuid, { user, surveyId, date: new Date() })
  }
}

const dissocUserUuid = (recordUuid, userUuid) => {
  const userUids = getUserUuids(recordUuid)

  userUids.delete(userUuid)

  if (userUids.size === 0) {
    recordUserUuidsMap.delete(recordUuid)
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
  getUserUuids,

  assocUser,
  dissocUserUuid,

  touchPreviewRecord,
  getStalePreviewRecordUuids,
}