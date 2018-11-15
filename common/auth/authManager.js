const R = require('ramda')
const {groupNames} = require('./authGroups')

const isSystemAdmin = user => R.any(
  group => group.name === groupNames.surveyAdmin,
  user.groups
)


module.exports = {
  isSystemAdmin
}