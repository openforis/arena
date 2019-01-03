const R = require('ramda')

const StringUtils = require('../../../../common/stringUtils')
const ArrayUtils = require('../../../../common/arrayUtils')

const Node = require('../../../../common/record/node')
const NodeDef = require('../../../../common/survey/nodeDef')
const Survey = require('../../../../common/survey/survey')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const NodeDefExpression = require('../../../../common/survey/nodeDefExpression')

const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')
const RecordDependencyManager = require('../../recordDependencyManager')
const RecordExprParser = require('../../../record/recordExprParser')
const RecordProcessor = require('./recordProcessor')

const applyDefaultValue = async (user, survey, node, tx) => {
  const surveyId = Survey.getSurveyInfo(survey).id
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const defaultValues = NodeDef.getDefaultValues(nodeDef)

  for (const defaultValue of defaultValues) {
    const applyIf = NodeDefExpression.getApplyIf(defaultValue)
    if (StringUtils.isBlank(applyIf) || await RecordExprParser.evalNodeQuery(survey, node, applyIf, tx)) {
      const value = await RecordExprParser.evalNodeQuery(survey, node, NodeDefExpression.getExpression(defaultValue), tx)

      console.log(`update node ${NodeDef.getNodeDefName(nodeDef)} with value ${value}`)

      return R.values(await RecordProcessor.persistNode(user, surveyId, Node.assocValue(value)(node), tx))
    }
  }
  return []
}

const applyDefaultValuesToDependentNodes = async (user, survey, nodes, tx) => {
  const updatedNodes = []

  for (const node of R.values(nodes)) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const dependentNodes = await RecordDependencyManager.fetchDependentNodes(Survey.getSurveyInfo(survey).id, node, nodeDef, dependencyTypes.defaultValues, tx)

    for (const dependentNode of dependentNodes) {
      if (Node.isNodeValueBlank(Node.getNodeValue(dependentNode, null))) {
        ArrayUtils.pushAll(updatedNodes, await applyDefaultValue(user, survey, dependentNode, tx))
      }
    }
  }

  return toUuidIndexedObj(updatedNodes)
}

module.exports = {
  applyDefaultValuesToDependentNodes
}