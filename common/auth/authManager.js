const R = require('ramda')

const Record = require('../record/record')

const {groupNames, permissions} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.systemAdmin,
  user.authGroups,
)

const getSurveyUserPermissions = (user, surveyInfo) => {
  return R.pipe(
    R.innerJoin((ug, sg) => ug.id === sg.id),
    R.head, // there's only one group per user per survey
    R.propOr([], 'permissions'),
  )(user.authGroups, R.pathOr([], ['authGroups'], surveyInfo))
}

const getRecordUserPermissions = (user, record) =>
  R.find(R.propEq('surveyId', R.prop('surveyId', record)))
    (R.prop('authGroups', user))


const getRecordDataStep = R.prop('step')

const getUserDataSteps = R.pathOr([])


const hasSurveyPermission = (permission, user, surveyInfo) =>
  user && surveyInfo &&
  (
    isSystemAdmin(user)
    ||
    R.includes(permission, getSurveyUserPermissions(user, surveyInfo))
  )

const canEditRecord = (user, record) => {
  const recordDataStep = getRecordDataStep(record)
  const recordUserPermissions = getRecordUserPermissions(user, record)

  // level = 'all' or 'own'
  const level = R.path(['dataSteps', recordDataStep], recordUserPermissions)

  return level === 'all' || allOrOwn === 'own' && Record.getOwnerId(record) === user.id
}

const canEditSurvey = R.partial(hasSurveyPermission, [permissions.surveyEdit])

// const canCreateRecord = R.partial(hasRecordPermission, [permissions.recordCreate])

// const canEditRecord = R.partial(hasRecordEditPermission, [permissions.recordDataEdit])
// const canViewRecord = R.partial(hasRecordPermission, [permissions.recordView])

module.exports = {
  isSystemAdmin,

  // Survey permissions
  canEditSurvey,

  // Record permissions
  // canCreateRecord,
  canEditRecord,
  // canViewRecord,
}


// TODO
// dataSteps should be called recordEditSteps? The only apply to record edit permissions
