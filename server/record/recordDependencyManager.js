const R = require('ramda')

const Node = require('../../common/record/node')

const SurveyRepository = require('../survey/surveyRepository')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const NodeRepository = require('../record/nodeRepository')

const fetchDependentNodes = async (surveyId, node, nodeDef, dependencyType, tx) => {
  const dependencies = await SurveyRepository.fetchDepedenciesByNodeDefUuid(surveyId, dependencyType, nodeDef.uuid, tx)

  if (dependencies) {
    const dependentDefs = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependencies, false, tx)

    return R.reduce((acc, dependents) => R.concat(acc, dependents), [],
      await Promise.all(
        dependentDefs.map(async dependentDef => {
          const commonParentDefUuid = R.last(R.intersection(nodeDef.meta.h, dependentDef.meta.h))
          const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, tx)
          return await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), commonParentNode.uuid, dependentDef.uuid, tx)
        })
      )
    )
  } else {
    return []
  }
}

module.exports = {
  fetchDependentNodes,
}