const R = require('ramda')

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

  const lang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))

  return R.pipe(
    R.reduce(
      (acc, exprEval) => {
        const { expression, value: valid } = exprEval
        return valid
          ? acc
          : R.append(NodeDefExpression.getMessage(lang, errorKeys.invalidValue)(expression), acc)
      },
      []
    ),
    R.ifElse(
      R.isEmpty,
      R.always(null), //all validations are 'valid'
      R.join('; ') //join the error messages with a ';' separator
    )
  )(applicableExpressionsEval)
}

const validateAttribute = async (survey, record, attribute, nodeDef) =>
  await Validator.validate(attribute, {
    [Node.keys.value]: [
      validateRequired(survey, nodeDef),
      AttributeTypeValidator.validateValueType(survey, nodeDef),
      validateNodeValidations(survey, record, nodeDef)
    ]
  }, false)

const validateSelfAndDependentAttributes = async (survey, record, nodes) => {

  const attributes = R.pipe(
    R.values,
    R.filter(node => NodeDef.isAttribute(getNodeDef(survey, node)))
  )(nodes)

  const validatedAttributeUuids = [] //used to avoid validating 2 times the same attributes

  const attributeValidations = {}

  for (const attribute of attributes) {
    const dependents = Record.getDependentNodes(survey, attribute, Survey.dependencyTypes.validations)(record)

    // include attribute itself if it's not already included among dependents
    const attributeAndDependents =
      R.includes(dep => R.equals(attribute, dep.nodeCtx))(dependents)
        ? dependents
        : R.append({
          nodeDef: getNodeDef(survey, attribute),
          nodeCtx: attribute
        })(dependents)

    // call validateAttribute for each attribute

    for (const { nodeCtx, nodeDef } of attributeAndDependents) {

      if (Node.isDeleted(attribute)) {
        return null
      }
      const attributeValidation = await validateAttribute(survey, record, nodeCtx, nodeDef)

      const nodeCtxUuid = Node.getUuid(nodeCtx)

      // mark attribute validated
      validatedAttributeUuids.push(nodeCtxUuid)

      attributeValidations[nodeCtxUuid] = attributeValidation
    }
  }
  return attributeValidations
}

const getNodeDef = (survey, node) =>
  Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

module.exports = {
  validateAttribute,
  validateSelfAndDependentAttributes
}