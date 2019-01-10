const R = require('ramda')
const Promise = require('bluebird')

const StringUtils = require('../../../../common/stringUtils')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const RecordExprParser = require('../../../record/recordExprParser')
const NodeRepository = require('../../../record/nodeRepository')

const updateNodesApplicability = async (user, survey, nodesArray, tx) =>
  R.mergeAll(
    await Promise.all(
      nodesArray.map(async node => await updateNodeApplicability(survey, node, tx))
    )
  )

const updateNodeApplicability = async (survey, node, tx) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

  if (!NodeDef.isNodeDefRoot(nodeDef)) {
    const surveyId = Survey.getSurveyInfo(survey).id
    const parentNode = await NodeRepository.fetchNodeByUuid(surveyId, Node.getParentUuid(node), tx)

    const newApplicability = await isApplicable(survey, node, tx)

    if (newApplicability !== Node.isChildApplicable(Node.getNodeDefUuid(node))(parentNode)) {
      await NodeRepository.updateChildrenApplicability(surveyId, Node.getParentUuid(node), NodeDef.getUuid(nodeDef), newApplicability, tx)
      return toUuidIndexedObj(await NodeRepository.fetchChildNodesByNodeDefUuid(surveyId, Node.getRecordUuid(node), parentNode.uuid, Node.getNodeDefUuid(node), tx))
    }
  }
  return {}
}

const isApplicable = async (survey, node, client) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const applicableIfExpr = R.pipe(
    NodeDef.getApplicable,
    R.head,
    NodeDefExpression.getExpression
  )(nodeDef)

  return StringUtils.isBlank(applicableIfExpr)
    ? true
    : await RecordExprParser.evalNodeQuery(survey, node, applicableIfExpr, client)
}

module.exports = {
  updateNodesApplicability
}
