const R = require('ramda')

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const keys = {
  id: 'id',
  authGroups: 'authGroups',
  surveyId: 'surveyId',
  name: 'name',
  email: 'email',

  groupName: 'groupName',
  accepted: 'accepted',
}

const validEmail = email => validEmailRe.test(email)

const getAuthGroups = R.prop(keys.authGroups)

const getRecordPermissions = record =>
  user =>
    R.pipe(
      getAuthGroups,
      R.find(
        R.propEq(keys.surveyId, R.prop(keys.surveyId, record))
      )
    )(user)

const getId = R.prop(keys.id)

const getName = R.prop(keys.name)

const getEmail = R.prop(keys.email)

// The following methods are used in UserListView. They are meant to work on the
// object returned by the '/api/survey/:surveyId/users' entry point.
const getGroupName = R.prop(keys.groupName)
const getAccepted = R.prop(keys.accepted)

module.exports = {
  keys,

  validEmail,
  getId,
  getName,
  getEmail,
  getAuthGroups,
  getRecordPermissions,

  getGroupName,
  getAccepted,
}
