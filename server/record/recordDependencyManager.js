const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../common/survey/survey')
const Node = require('../../common/record/node')

const SurveyRepository = require('../survey/surveyRepository')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const NodeRepository = require('../record/nodeRepository')

const fetchDependentNodes = async (survey, node, dependencyType, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  const dependencies = await SurveyRepository.fetchDepedenciesByNodeDefUuid(surveyId, dependencyType, nodeDef.uuid, tx)

  if (dependencies) {
    const dependentDefs = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependencies, false, tx)

    const dependentsPerDef = await Promise.all(
      dependentDefs.map(async dependentDef => {
        const commonParentDefUuid = R.last(R.intersection(nodeDef.meta.h, dependentDef.meta.h))
        const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, tx)
        return await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), commonParentNode.uuid, dependentDef.uuid, tx)
      })
    )
    return R.pipe(
      R.flatten,
      R.uniq,
    )(dependentsPerDef)
  } else {
    return []
  }
}

module.exports = {
  fetchDependentNodes,
}