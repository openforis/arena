const R = require('ramda')

const keys = {
  id: 'id',
  authGroups: 'authGroups',
  surveyId: 'surveyId',
}

const validEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

const getRecordPermissions = record => user =>
  R.find(R.propEq(keys.surveyId, R.prop(keys.surveyId, record)))(R.prop(keys.authGroups, user))

module.exports = {
  validEmail,
  getId: R.prop(keys.id),
  getRecordPermissions,
}
