const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const NodeDefExpression = require('../../survey/nodeDefExpression')
const NodeDefValidations = require('../../survey/nodeDefValidations')
const Record = require('../record')
const Node = require('../node')
const RecordExprParser = require('../recordExprParser')
const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')
const ValidationResult = require('../../validation/validationResult')
const StringUtils = require('../../stringUtils')

const AttributeTypeValidator = require('./attributeTypeValidator')
const AttributeKeyValidator = require('./attributeKeyValidator')

const _validateRequired = (survey, nodeDef) => (propName, node) =>
  (
    NodeDef.isKey(nodeDef) ||
    NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))
  ) &&
  Node.isValueBlank(node)
    ? { key: Validation.messageKeys.record.valueRequired }
    : null

/**
 * Evaluates the validation expressions.
 * Returns 'null' if all are valid, a concatenated error message otherwise.
 */
const _validateNodeValidations = (survey, record, nodeDef) => async (propName, node) => {
  if (Node.isValueBlank(node)) {
    return null
  }
  const validations = NodeDef.getValidations(nodeDef)

  const applicableExpressionsEval = await RecordExprParser.evalApplicableExpressions(survey, record, node, NodeDefValidations.getExpressions(validations))

  let errorMessage = null

  for (const { expression, value: valid } of applicableExpressionsEval) {
    if (!valid) {
      const messages = _getCustomValidationMessages(survey, expression)

      errorMessage = ValidationResult.newInstance(
        Validation.keys.customErrorMessageKey,
        null,
        NodeDefExpression.getSeverity(expression),
        messages
      )
      break
    }
  }

  return errorMessage
}

const validateAttribute = async (survey, record, attribute, nodeDef) => {
  if (Record.isNodeApplicable(attribute)(record)) {
    return await Validator.validate(attribute, {
      [Node.keys.value]: [
        _validateRequired(survey, nodeDef),
        AttributeTypeValidator.validateValueType(survey, nodeDef),
        _validateNodeValidations(survey, record, nodeDef),
        AttributeKeyValidator.validateAttributeKey(survey, record, nodeDef)
      ]
    }, false)
  } else {
    return Validation.newInstance()
  }
}

const validateSelfAndDependentAttributes = async (survey, record, nodes) => {
  // output
  const attributeValidations = {}

  for (const node of Object.values(nodes)) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    if (NodeDef.isAttribute(nodeDef)) {

      // get dependents and attribute itself
      const nodePointersAttributeAndDependents = Record.getDependentNodePointers(survey, node, Survey.dependencyTypes.validations, true)(record)

      const nodesToValidate = [
        ..._nodePointersToNodes(nodePointersAttributeAndDependents),
        ...NodeDef.isKey(nodeDef)
          ? _getSiblingNodeKeys(survey, nodeDef, record, Record.getParentNode(node)(record))
          : []
      ]

      // call validateAttribute for each attribute

      for (const node of nodesToValidate) {
        const nodeUuid = Node.getUuid(node)

        // validate only attributes not deleted and not validated already
        if (!Node.isDeleted(node) && !attributeValidations[nodeUuid]) {
          const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
          attributeValidations[nodeUuid] = await validateAttribute(survey, record, node, nodeDef)
        }
      }
    }
  }
  return attributeValidations
}

const _getCustomValidationMessages = (survey, expression) => {
  const messages = NodeDefExpression.getMessages(expression)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const languages = Survey.getLanguages(surveyInfo)

  for (const lang of languages) {
    const customMessage = messages[lang]
    if (StringUtils.isBlank(customMessage)) {
      // when custom message is blank, use the expression itself
      messages[lang] = NodeDefExpression.getExpression(expression)
    }
  }
  return messages
}

const _getSiblingNodeKeys = (survey, nodeDefKey, record, node) => {
  const siblingKeys = []
  const siblings = Record.getNodeSiblingsAndSelf(node)(record)
  for (const sibling of siblings) {
    const nodesKey = Record.getEntityKeyNodes(survey, sibling)(record)
    siblingKeys.push.apply(siblingKeys, nodesKey)
  }
  return siblingKeys
}

const _nodePointersToNodes = R.pluck('nodeCtx')

module.exports = {
  validateAttribute,
  validateSelfAndDependentAttributes
}