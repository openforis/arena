const R = require('ramda')

const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

const RecordDependencyManager = require('../../recordDependencyManager')

const DefaultValuesUpdater = require('./defaultValuesUpdater')
const ApplicableIfUpdater = require('./applicableIfIUpdater')

/**
 * Class responsible for updating applicable and default values
 */

const updateDependentNodes = async (user, survey, nodes, t) => {
  let nodesToVisit = nodes
  let allUpdatedNodes = {}
  let lastUpdatedNodes = {}

  while (!R.isEmpty(nodesToVisit)) {
    lastUpdatedNodes = await updateDependentNodesInternal(user, survey, nodesToVisit, t)

    nodesToVisit = R.reject(node => R.includes(node.uuid, R.keys(allUpdatedNodes)))(lastUpdatedNodes)

    allUpdatedNodes = R.mergeRight(allUpdatedNodes, lastUpdatedNodes)
  }

  return allUpdatedNodes
}

const updateDependentNodesInternal = async (user, survey, nodes, t) => {
  const nodesArray = R.values(nodes)
  const nodesApplicability = await updateApplicability(user, survey, nodesArray, t)
  const nodesDefaultValues = await applyDefaultValues(user, survey, nodesArray, t)

  return R.mergeRight(nodesApplicability, nodesDefaultValues)
}

const updateApplicability = async (user, survey, nodesArray, t) => {
  const dependents = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.applicable, t)

  return await ApplicableIfUpdater.updateNodesApplicability(user, survey, R.concat(dependents, nodesArray), t)
}

const applyDefaultValues = async (user, survey, nodesArray, t) => {
  const defaultValuesDependentNodes = await RecordDependencyManager.fetchDependentNodes(survey, nodesArray, dependencyTypes.defaultValues, t)

  const defaultValueToRecalculatedNodes = R.concat(defaultValuesDependentNodes, nodesArray)

  return await DefaultValuesUpdater.applyDefaultValues(user, survey, defaultValueToRecalculatedNodes, t)
}

module.exports = {
  updateDependentNodes
}