const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const Node = require('../../../../common/record/node')

const SurveyRepository = require('../../../survey/surveyRepository')
const NodeDefRepository = require('../../../nodeDef/nodeDefRepository')
const NodeRepository = require('../../nodeRepository')

const fetchDependentNodesByNode = async (survey, node, dependencyType, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const dependentUuids = await SurveyRepository.fetchDepedenciesByNodeDefUuid(surveyId, dependencyType, nodeDef.uuid, tx)

  if (dependentUuids) {
    const dependentDefs = await NodeDefRepository.fetchNodeDefsByUuid(surveyId, dependentUuids, false, tx)

    const dependentsPerDef = await Promise.all(
      dependentDefs.map(async dependentDef => {
        //1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(nodeDef.meta.h),
          R.last
        )(dependentDef.meta.h)
        //2 find common parent node
        const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, node.uuid, commonParentDefUuid, tx)
        //3 find descendent nodes of common parent node with nodeDefUuid=dependentDef.uuid
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

const fetchDependentNodes = async (survey, nodesArray, dependencyType, t) =>
  R.flatten(
    await Promise.all(
      nodesArray.map(async node =>
        await fetchDependentNodesByNode(survey, node, dependencyType, t)
      )
    )
  )

module.exports = {
  fetchDependentNodes
}