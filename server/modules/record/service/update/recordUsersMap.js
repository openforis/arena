const R = require('ramda')

const User = require('../../../../../common/user/user')
const DateUtils = require('../../../../../common/dateUtils')

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
      dissocUsers(recordUuid)
    }
  }
}

const dissocUsers = recordUuid => {
  userUuidsByRecordUuid.delete(recordUuid)
  previewRecordsByRecordUuid.delete(recordUuid)
}

const touchPreviewRecord = recordUuid => {
  const previewData = previewRecordsByRecordUuid.get(recordUuid)
  previewRecordsByRecordUuid.set(recordUuid, { ...previewData, date: new Date() })
}

const getStalePreviewRecordUuids = olderThan =>
  Array.from(previewRecordsByRecordUuid.entries()).reduce(
    (acc, [recordUuid, { date, surveyId, user }]) => {
      if (DateUtils.isBefore(date, olderThan)) {
        acc.push({ recordUuid, surveyId, user })
      }
      return acc
    },
    []
  )

module.exports = {
  getUserUuids,
  getRecordUuid,

  assocUser,
  dissocUser,
  dissocUsers,

  touchPreviewRecord,
  getStalePreviewRecordUuids,
}