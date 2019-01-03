const R = require('ramda')

const ArrayUtils = require('../../common/arrayUtils')

const Node = require('../../common/record/node')

const SurveyRepository = require('../survey/surveyRepository')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const NodeRepository = require('../record/nodeRepository')

const fetchDependentNodes = async (surveyId, node, nodeDef, dependencyType, tx) => {
  const result = []

  const dependencies = await SurveyRepository.fetchDepedenciesByNodeDefUuid(surveyId, dependencyType, nodeDef.uuid, tx)

  if (dependencies) {
    for (const dependentDef of await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependencies, false, tx)) {
      const commonParentDefUuid = R.last(R.intersection(nodeDef.meta.h, dependentDef.meta.h))
      const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, tx)
      const dependents = await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), commonParentNode.uuid, dependentDef.uuid, tx)
      ArrayUtils.pushAll(result, dependents)
    }
  }

  return result
}


module.exports = {
  fetchDependentNodes,
}