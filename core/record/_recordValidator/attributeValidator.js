import * as R from 'ramda'

import * as PromiseUtils from '@core/promiseUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as StringUtils from '@core/stringUtils'
import * as RecordExpressionParser from '../recordExpressionParser'
import * as Node from '../node'
import * as Record from '../record'

import * as AttributeTypeValidator from './attributeTypeValidator'
import * as AttributeKeyValidator from './attributeKeyValidator'
import * as AttributeUniqueValidator from './attributeUniqueValidator'

const _validateRequired = ({ nodeDef }) => (_propName, node) =>
  (NodeDef.isKey(nodeDef) || NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))) && Node.isValueBlank(node)
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

  const applicableExpressionsEval = RecordExpressionParser.evalApplicableExpressions(
    survey,
    record,
    node,
    NodeDefValidations.getExpressions(validations)
  )

  let errorMessage = null

  for (const { expression, value: valid } of applicableExpressionsEval) {
    if (!valid) {
      const messages = _getCustomValidationMessages(survey, expression)

      errorMessage = ValidationResult.newInstance(
        ValidationResult.keys.customErrorMessageKey,
        null,
        NodeDefExpression.getSeverity(expression),
        messages
      )
      break
    }
  }

  return errorMessage
}

export const validateAttribute = async (survey, record, attribute) => {
  if (Record.isNodeApplicable(attribute)(record)) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(attribute))(survey)
    return Validator.validate(
      attribute,
      {
        [Node.keys.value]: [
          _validateRequired({ nodeDef }),
          AttributeTypeValidator.validateValueType(survey, nodeDef),
          _validateNodeValidations(survey, record, nodeDef),
          AttributeKeyValidator.validateAttributeKey(survey, record, nodeDef),
          AttributeUniqueValidator.validateAttributeUnique(survey, record, nodeDef),
        ],
      },
      false
    )
  }

  return Validation.newInstance()
}

export const validateSelfAndDependentAttributes = async (survey, record, nodes) => {
  // Output
  const attributeValidations = {}

  await PromiseUtils.each(Object.values(nodes), async (node) => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)

    if (NodeDef.isAttribute(nodeDef)) {
      // Get dependents and attribute itself
      const nodePointersAttributeAndDependents = Record.getDependentNodePointers(
        survey,
        node,
        Survey.dependencyTypes.validations,
        true
      )(record)

      const nodesToValidate = [
        ..._nodePointersToNodes(nodePointersAttributeAndDependents),
        ...(NodeDef.isKey(nodeDef) ? _getSiblingNodeKeys(survey, record, Record.getParentNode(node)(record)) : []),
        ...(NodeDefValidations.isUnique(NodeDef.getValidations(nodeDef))
          ? Record.getAttributesUniqueSibling({ record, attribute: node, attributeDef: nodeDef })
          : []),
      ]

      // Call validateAttribute for each attribute

      await PromiseUtils.each(nodesToValidate, async (_node) => {
        const nodeUuid = Node.getUuid(_node)

        // Validate only attributes not deleted and not validated already
        if (!Node.isDeleted(_node) && !attributeValidations[nodeUuid]) {
          attributeValidations[nodeUuid] = await validateAttribute(survey, record, _node)
        }
      })
    }
  })

  return attributeValidations
}

const _getCustomValidationMessages = (survey, expression) => {
  const messages = NodeDefExpression.getMessages(expression)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const languages = Survey.getLanguages(surveyInfo)

  for (const lang of languages) {
    const customMessage = messages[lang]
    if (StringUtils.isBlank(customMessage)) {
      // When custom message is blank, use the expression itself
      messages[lang] = NodeDefExpression.getExpression(expression)
    }
  }

  return messages
}

const _getSiblingNodeKeys = (survey, record, node) => {
  const siblingKeys = []

  const nodeParent = Record.getParentNode(node)(record)
  const siblings = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)

  for (const sibling of siblings) {
    const nodesKey = Record.getEntityKeyNodes(survey, sibling)(record)
    siblingKeys.push(...nodesKey)
  }

  return siblingKeys
}

const _nodePointersToNodes = R.pluck('nodeCtx')
