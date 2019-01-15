const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Node = require('../../../../common/record/node')

const SurveyRepository = require('../../../survey/surveyRepository')
const NodeRepository = require('../../nodeRepository')

const fetchDependentNodesByNode = async (survey, node, dependencyType, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id

  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const dependentUuids = Survey.getNodeDefDependencies(nodeDefUuid, dependencyType)(survey)

  if (dependentUuids) {
    const dependentDefs = Survey.getNodeDefsByUuids(dependentUuids)(survey)

    const dependentsPerDef = await Promise.all(
      dependentDefs.map(async dependentDef => {
        //1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
          R.last
        )(NodeDef.getMetaHierarchy(dependentDef))

        //2 find common parent node
        const commonParentNode = await NodeRepository.fetchAncestorByNodeDefUuid(surveyId, Node.getUuid(node), commonParentDefUuid, tx)

        //3 find descendent nodes of common parent node with nodeDefUuid = dependentDef uuid
        return await NodeRepository.fetchDescendantNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), Node.getUuid(commonParentNode), NodeDef.getUuid(dependentDef), tx)
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