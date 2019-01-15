const R = require('ramda')

const Node = require('../../../../common/record/node')
const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

const RecordDependencyManager = require('./recordDependencyManager')

const DefaultValuesUpdater = require('./defaultValuesUpdater')
const ApplicableUpdater = require('./applicableUpdater')
const CalculatedValuesUpdater = require('./calculatedValuesUpdater')

/**
 * Class responsible for updating applicable and default values
 */

const updateDependentNodes = async (user, survey, nodes, t) => {
  let nodesToVisit = nodes
  let allUpdatedNodes = {}
  let lastUpdatedNodes = {}

  while (!R.isEmpty(nodesToVisit)) {
    lastUpdatedNodes = await updateDependentNodesInternal(user, survey, nodesToVisit, t)

    nodesToVisit = R.reject(node => R.includes(Node.getUuid(node), R.keys(allUpdatedNodes)))(lastUpdatedNodes)

    allUpdatedNodes = R.mergeRight(allUpdatedNodes, lastUpdatedNodes)
  }

  return allUpdatedNodes
}

const updateDependentNodesInternal = async (user, survey, nodes, t) => {
  const nodesArray = R.values(nodes)

  const nodesApplicability = await updateApplicability(user, survey, nodesArray, t)
  const nodesCalculatedValues = await applyCalculatedValues(user, survey, nodesArray, t)
  const nodesDefaultValues = await applyDefaultValues(user, survey, nodesArray, t)

  return R.pipe(
    R.mergeRight(nodesCalculatedValues),
    R.mergeRight(nodesDefaultValues),
  )(nodesApplicability)
}

const updateApplicability = async (user, survey, nodesArray, t) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.applicable, t)
  return new ApplicableUpdater(user, survey).updateNodes(R.concat(dependents, nodesArray), t)
}

const applyCalculatedValues = async (user, survey, nodesArray, t) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.calculatedValues, t)
  return new CalculatedValuesUpdater(user, survey).updateNodes(R.concat(dependents, nodesArray), t)
}

const applyDefaultValues = async (user, survey, nodesArray, t) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.defaultValues, t)
  const calculatedValuesDependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.calculatedValues, t)
  return new DefaultValuesUpdater(user, survey).updateNodes(R.reduce(R.concat, [], [dependents, calculatedValuesDependents, nodesArray]), t)
}

module.exports = {
  updateDependentNodes
}