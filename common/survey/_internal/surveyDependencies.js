const R = require('ramda')

const getNodeDefDependencies = (nodeDefUuid, dependencyType) =>
  R.path(['dependencyGraph', dependencyType, nodeDefUuid])

module.exports = {
  getNodeDefDependencies,
}