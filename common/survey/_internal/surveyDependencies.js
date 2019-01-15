const R = require('ramda')

const getDepedenciesByNodeDefUuid = (survey, dependencyType, nodeDefUuid) =>
  R.path(['dependencyGraph', dependencyType, nodeDefUuid], survey)

module.exports = {
  getDepedenciesByNodeDefUuid,
}