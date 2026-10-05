import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import * as ValidationResult from '@core/validation/validationResult'

import * as CollectSurvey from '../../model/collectSurvey'
import { CollectExpressionConverter } from './collectExpressionConverter'

const jsOperatorByCollectOperator = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
}

const collectCheckType = {
  check: 'check',
  compare: 'compare',
  distance: 'distance',
  pattern: 'pattern',
  unique: 'unique',
}

const collectConstantDateValueRegExp = /(\d{4})(\d{2})(\d{2})/ // date in YYYYMMDD format
const collectConstantTimeValueRegExp = /(\d{2})(\d{2})/ // time in mmss format

const operandConverterByNodeDefType = {
  [NodeDef.nodeDefType.date]: ({ collectOperand }) => {
    // convert constant date values to Arena format
    const match = String(collectOperand).trim().match(collectConstantDateValueRegExp)
    if (match) {
      // eslint-disable-next-line no-unused-vars
      const [_, year, month, day] = match
      return JSON.stringify(`${year}-${month}-${day}`)
    }
    return collectOperand
  },
  [NodeDef.nodeDefType.time]: ({ collectOperand }) => {
    // convert constant time values to Arena format
    const match = String(collectOperand).trim().match(collectConstantTimeValueRegExp)
    if (match) {
      // eslint-disable-next-line no-unused-vars
      const [_, minute, second] = match
      return JSON.stringify(`${minute}:${second}`)
    }
    return collectOperand
  },
}

const checkExpressionParserByType = {
  [collectCheckType.compare]: ({ collectCheck, nodeDef }) => {
    const attributes = CollectSurvey.getAttributes(collectCheck)
    const exprParts = Object.entries(attributes).reduce((accParts, [collectOperator, collectRightOperand]) => {
      const operator = jsOperatorByCollectOperator[collectOperator]
      if (operator) {
        const operandConverter = operandConverterByNodeDefType[NodeDef.getType(nodeDef)]
        const rightOperand = operandConverter
          ? operandConverter({ collectOperand: collectRightOperand })
          : collectRightOperand
        accParts.push(`$this ${operator} ${rightOperand}`)
      }
      return accParts
    }, [])

    return exprParts.join(' and ')
  },
  [collectCheckType.check]: ({ collectCheck }) => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
  [collectCheckType.distance]: ({ collectCheck }) => {
    const { max, to } = CollectSurvey.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  [collectCheckType.pattern]: ({ collectCheck }) => {
    const { regex } = CollectSurvey.getAttributes(collectCheck)
    return regex
  },
  [collectCheckType.unique]: ({ collectCheck }) => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
}

const isUniqueCheckConvertible = ({ survey, collectValidationRule, nodeDefCurrent }) => {
  const { expr } = CollectSurvey.getAttributes(collectValidationRule)
  const nodeDefName = NodeDef.getName(nodeDefCurrent)
  const nodeDefParent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  return (
    (NodeDef.isMultipleAttribute(nodeDefCurrent) && expr === nodeDefName) ||
    expr === `parent()/${NodeDef.getName(nodeDefParent)}/${nodeDefName}`
  )
}

const checkExpressionConverterByType = {
  [collectCheckType.compare]: async ({ survey, collectExpr, nodeDefCurrent }) => ({
    exprConverted: await CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: collectExpr,
      advancedExpressionEditor: false,
    }),
  }),
  [collectCheckType.distance]: async ({ survey, collectValidationRule, nodeDefCurrent }) => {
    const { max, to } = CollectSurvey.getAttributes(collectValidationRule)
    const toExprConverted = await CollectExpressionConverter.convert({ survey, nodeDefCurrent, expression: to })
    return {
      exprConverted: toExprConverted
        ? `distance(${NodeDef.getName(nodeDefCurrent)}, ${toExprConverted}) <= ${max}\n`
        : null,
    }
  },
  [collectCheckType.pattern]: async ({ collectExpr }) => {
    const regexDelimited = `${A.pipe(StringUtils.prependIfMissing('^'), StringUtils.appendIfMissing('$'))(collectExpr)}`
    return { exprConverted: `/${regexDelimited}/.test(this)\n` }
  },
  // uniqueness expressions are converted only in simple cases, otherwise they must be converted "manually"
  [collectCheckType.unique]: async ({ survey, collectValidationRule, nodeDefCurrent }) => ({
    unique: isUniqueCheckConvertible({ survey, collectValidationRule, nodeDefCurrent }),
  }),
}

const convertCheckExpression = async ({ survey, checkType, collectValidationRule, collectExpr, nodeDefCurrent }) => {
  const converter = checkExpressionConverterByType[checkType]
  if (converter) {
    return converter({ survey, collectValidationRule, collectExpr, nodeDefCurrent })
  }
  return {
    exprConverted: await CollectExpressionConverter.convert({ survey, nodeDefCurrent, expression: collectExpr }),
  }
}

const parseValidationRule = async ({ survey, collectValidationRule, nodeDef: nodeDefCurrent, defaultLanguage }) => {
  const checkType = CollectSurvey.getElementName(collectValidationRule)
  const checkExpressionParser = checkExpressionParserByType[checkType]
  if (!checkExpressionParser) {
    // xml element is not a valid check
    return null
  }
  const collectExpr = checkExpressionParser({ collectCheck: collectValidationRule, nodeDef: nodeDefCurrent })

  if (StringUtils.isBlank(collectExpr)) {
    // empty expression
    return null
  }

  const { if: collectApplyIf, flag } = CollectSurvey.getAttributes(collectValidationRule)

  const { exprConverted = null, unique = false } = await convertCheckExpression({
    survey,
    checkType,
    collectValidationRule,
    collectExpr,
    nodeDefCurrent,
  })
  let applyIfConverted = null

  if (StringUtils.isNotBlank(collectApplyIf)) {
    applyIfConverted = await CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: collectApplyIf,
    })
  }

  const success =
    unique || (exprConverted !== null && (StringUtils.isBlank(collectApplyIf) || applyIfConverted !== null))

  const messages = CollectSurvey.toLabels('message', defaultLanguage)(collectValidationRule)

  // store import issue in any case: if expression has been converted without errors, mark it as resolved
  const importIssue = CollectImportReportItem.newReportItem({
    nodeDefUuid: NodeDef.getUuid(nodeDefCurrent),
    expressionType:
      flag === 'error'
        ? CollectImportReportItem.exprTypes.validationRuleError
        : CollectImportReportItem.exprTypes.validationRuleWarning,
    expression: collectExpr,
    applyIf: collectApplyIf,
    messages,
    resolved: success,
  })

  return {
    validationRule:
      success && exprConverted !== null
        ? NodeDefExpression.createExpression({
            expression: exprConverted,
            applyIf: applyIfConverted === null ? '' : applyIfConverted,
            severity: flag === 'error' ? ValidationResult.severity.error : ValidationResult.severity.warning,
            messages,
          })
        : null,
    importIssue,
    unique,
  }
}

export const parseValidationRules = async ({ survey, nodeDef, collectValidationRules, defaultLanguage }) => {
  const validationRules = []
  const importIssues = []
  let unique = false

  for (const collectValidationRule of collectValidationRules) {
    const parseResult = await parseValidationRule({ survey, collectValidationRule, nodeDef, defaultLanguage })
    if (parseResult) {
      const { validationRule, importIssue, unique: _unique } = parseResult
      if (validationRule) {
        validationRules.push(validationRule)
      }
      if (importIssue) {
        importIssues.push(importIssue)
      }
      if (_unique) {
        unique = true
      }
    }
  }
  return { validationRules, importIssues, unique }
}
