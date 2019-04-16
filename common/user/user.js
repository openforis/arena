const R = require('ramda')

const validEmailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const keys = {
  id: 'id',
  authGroups: 'authGroups',
  surveyId: 'surveyId',
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

module.exports = {
  validEmail,
  getId: R.prop(keys.id),
  getAuthGroups,
  getRecordPermissions,
}
