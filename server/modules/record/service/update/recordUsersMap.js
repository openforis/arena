const R = require('ramda')

const User = require('../../../../../common/user/user')
const { isDateBefore } = require('../../../../../common/dateUtils')

const userUuidsByRecordUuid = new Map()
const previewRecordsByRecordUuid = new Map()

const getUserUuids = recordUuid =>
  R.defaultTo(
    [],
    userUuidsByRecordUuid.get(recordUuid)
  )

const getRecordUuid = userUuid =>
  Array.from(userUuidsByRecordUuid.keys()).find(
    recordUuid => {
      const userUuids = userUuidsByRecordUuid.get(recordUuid)
      return userUuids && userUuids.has(userUuid)
    })

const assocUser = (surveyId, recordUuid, user, preview) => {
  if (!userUuidsByRecordUuid.has(recordUuid))
    userUuidsByRecordUuid.set(recordUuid, new Set())

  getUserUuids(recordUuid).add(User.getUuid(user))

  if (preview) {
    previewRecordsByRecordUuid.set(recordUuid, { user, surveyId, date: new Date() })
  }
}

const dissocUser = (recordUuid, userUuid) => {
  const userUuids = getUserUuids(recordUuid)

  if (!R.isEmpty(userUuids)) {
    userUuids.delete(userUuid)

    if (userUuids.size === 0) {
      userUuidsByRecordUuid.delete(recordUuid)
      previewRecordsByRecordUuid.delete(recordUuid)
    }
  }
}

const touchPreviewRecord = recordUuid => {
  const previewData = previewRecordsByRecordUuid.get(recordUuid)
  previewRecordsByRecordUuid.set(recordUuid, { ...previewData, date: new Date() })
}

const getStalePreviewRecordUuids = olderThan => {
  const array = []
  for (const [recordUuid, { date, surveyId, user }] of previewRecordsByRecordUuid.entries()) {
    if (isDateBefore(date, olderThan))
      array.push({ recordUuid, surveyId, user })
  }
  return array
}

module.exports = {
  getUserUuids,
  getRecordUuid,

  assocUser,
  dissocUser,

  touchPreviewRecord,
  getStalePreviewRecordUuids,
}