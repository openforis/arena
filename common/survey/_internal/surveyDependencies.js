const R = require('ramda')

const keys = {
  dependencyGraph: 'dependencyGraph'
}

const getDependencyGraph = R.propOr({}, keys.dependencyGraph)

const getNodeDefDependencies = (nodeDefUuid, dependencyType) =>
  R.path([keys.dependencyGraph, dependencyType, nodeDefUuid])

module.exports = {
  // READ
  getDependencyGraph,
  getNodeDefDependencies,

  // UPDATE
  assocDependencyGraph: dependencyGraph => R.assoc(keys.dependencyGraph, dependencyGraph)
}