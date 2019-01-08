const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../common/survey/survey')
const Node = require('../../common/record/node')

const SurveyRepository = require('../survey/surveyRepository')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')

class RecordDependencyManager {

  constructor (nodeRepository, nodeBindFunction) {
    this.nodeRepository = nodeRepository
    this.nodeBindFunction = nodeBindFunction
  }

  async fetchDependentNodesByNode (survey, node, dependencyType, tx) {
    const surveyId = Survey.getSurveyInfo(survey).id

    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    const dependentUuids = await SurveyRepository.fetchDepedenciesByNodeDefUuid(surveyId, dependencyType, nodeDef.uuid, tx)

    if (dependentUuids) {
      const dependentDefs = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependentUuids, false, tx)

      const dependentsPerDef = await Promise.all(
        dependentDefs.map(async dependentDef => {
          const commonParentDefUuid = R.last(R.intersection(nodeDef.meta.h, dependentDef.meta.h))
          const commonParentNode = await this.nodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, tx)
          return await this.nodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), commonParentNode.uuid, dependentDef.uuid, tx)
        })
      )
      return R.pipe(
        R.flatten,
        R.uniq,
        R.map(n => this.nodeBindFunction(survey, n, tx)),
      )(dependentsPerDef)
    } else {
      return []
    }
  }

  async fetchDependentNodes (survey, nodesArray, dependencyType, t) {
    return R.flatten(
      await Promise.all(
        nodesArray.map(async node =>
          await this.fetchDependentNodesByNode(survey, node, dependencyType, t)
        )
      )
    )
  }
}

module.exports = RecordDependencyManager