const R = require('ramda')

const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

const RecordDependencyManager = require('../../recordDependencyManager')

const DefaultValuesUpdater = require('./defaultValuesUpdater')
const ApplicableIfUpdater = require('./applicableIfIUpdater')

const NodeRepository = require('../../../record/nodeRepository')

/**
 * Class responsible for updating applicable and default values
 */
class DependentNodesUpdater {

  constructor (survey) {
    this.survey = survey

    this.recordDependencyManager = new RecordDependencyManager(NodeRepository)
    this.defaultValuesUpdater = new DefaultValuesUpdater(NodeRepository)
    this.applicableIfUpdater = new ApplicableIfUpdater(NodeRepository)
  }

  async updateDependentNodes (user, nodes, t) {
    let nodesToVisit = nodes
    let allUpdatedNodes = {}
    let lastUpdatedNodes = {}

    while (!R.isEmpty(nodesToVisit)) {
      lastUpdatedNodes = await this._updateDependentNodesInternal(user, nodesToVisit, t)

      nodesToVisit = R.reject(node => R.includes(node.uuid, R.keys(allUpdatedNodes)))(lastUpdatedNodes)

      allUpdatedNodes = R.mergeRight(allUpdatedNodes, lastUpdatedNodes)
    }

    return allUpdatedNodes
  }

  async _updateDependentNodesInternal (user, nodes, t) {
    const nodesArray = R.values(nodes)
    const nodesApplicability = await this.updateApplicability(user, nodesArray, t)
    const nodesDefaultValues = await this.applyDefaultValues(user, nodesArray, t)

    return R.mergeRight(nodesApplicability, nodesDefaultValues)
  }

  async updateApplicability (user, nodesArray, t) {
    const dependents = await this.recordDependencyManager.fetchDependentNodes(this.survey, nodesArray, dependencyTypes.applicable, t)

    return await this.applicableIfUpdater.updateNodesApplicability(user, this.survey, R.concat(dependents, nodesArray), t)
  }

  async applyDefaultValues (user, nodesArray, t) {
    const defaultValuesDependentNodes = await this.recordDependencyManager.fetchDependentNodes(this.survey, nodesArray, dependencyTypes.defaultValues, t)

    const defaultValueToRecalculatedNodes = R.concat(defaultValuesDependentNodes, nodesArray)

    return await this.defaultValuesUpdater.applyDefaultValues(user, this.survey, defaultValueToRecalculatedNodes, t)
  }
}

module.exports = DependentNodesUpdater