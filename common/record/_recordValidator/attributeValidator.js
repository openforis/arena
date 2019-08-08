const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const NodeDefExpression = require('../../survey/nodeDefExpression')
const NodeDefValidations = require('../../survey/nodeDefValidations')
const Validator = require('../../validation/validator')

const Record = require('../record')
const Node = require('../node')
const RecordExprParser = require('../recordExprParser')

const AttributeTypeValidator = require('./attributeTypeValidator')

const errorKeys = {
  required: 'required',
  invalidValue: 'invalidValue',
}

const validateRequired = (survey, nodeDef) => (propName, node) =>
  (
    NodeDef.isKey(nodeDef) ||
    NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))
  ) &&
  Node.isValueBlank(node)
    ? { key: errorKeys.required }
    : null

/**
 * Evaluates the validation expressions.
 * Returns 'null' if all are valid, a concatenated error message otherwise.
 */
const validateNodeValidations = (survey, record, nodeDef) => async (propName, node) => {
  if (Node.isValueBlank(node)) {
    return null
  }
  const validations = NodeDef.getValidations(nodeDef)

  const applicableExpressionsEval = await RecordExprParser.evalApplicableExpressions(survey, record, node, NodeDefValidations.getExpressions(validations))

  let errorMessage = null

  for (const { expression, value: valid } of applicableExpressionsEval) {
    if (!valid) {
      errorMessage = {
        key: 'custom',
        messages: NodeDefExpression.getMessages(expression)
      }
      break
    }
  }

  return errorMessage
}

const validateAttribute = async (survey, record, attribute, nodeDef) => {
  if (Record.isNodeApplicable(attribute)(record)) {
    return await Validator.validate(attribute, {
      [Node.keys.value]: [
        validateRequired(survey, nodeDef),
        AttributeTypeValidator.validateValueType(survey, nodeDef),
        validateNodeValidations(survey, record, nodeDef)
      ]
    }, false)
  } else {
    return Validator.newValidationValid()
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

      // call validateAttribute for each attribute

      for (const { nodeCtx, nodeDef } of nodePointersAttributeAndDependents) {
        const nodeCtxUuid = Node.getUuid(nodeCtx)

        // validate only attributes not deleted and not validated already
        if (!Node.isDeleted(nodeCtx) && !attributeValidations[nodeCtxUuid]) {
          attributeValidations[nodeCtxUuid] = await validateAttribute(survey, record, nodeCtx, nodeDef)
        }
      }
    }
  }
  return attributeValidations
}

module.exports = {
  validateAttribute,
  validateSelfAndDependentAttributes
}