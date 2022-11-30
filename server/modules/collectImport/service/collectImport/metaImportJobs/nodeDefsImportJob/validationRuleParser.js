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

const collectConstantDateValueRegExp = /(\d{4})(\d{2})(\d{2})/ // date in yyyyMMdd format
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

const parseValidationRule = ({ survey, collectValidationRule, nodeDef: nodeDefCurrent, defaultLanguage }) => {
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

  let exprConverted = null
  let applyIfConverted = null
  let unique = false

  if (checkType === collectCheckType.compare) {
    exprConverted = CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: collectExpr,
      advancedExpressionEditor: false,
    })
  } else if (checkType === collectCheckType.distance) {
    const { max, to } = CollectSurvey.getAttributes(collectValidationRule)
    const toExprConverted = CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: to,
    })
    if (toExprConverted) {
      exprConverted = `distance(${NodeDef.getName(nodeDefCurrent)}, ${toExprConverted}) <= ${max}\n`
    }
  } else if (checkType === collectCheckType.pattern) {
    const regexDelimited = `${A.pipe(StringUtils.prependIfMissing('^'), StringUtils.appendIfMissing('$'))(collectExpr)}`
    exprConverted = `/${regexDelimited}/.test(this)\n`
  } else if (checkType === collectCheckType.unique) {
    const { expr } = CollectSurvey.getAttributes(collectValidationRule)
    const nodeDefName = NodeDef.getName(nodeDefCurrent)
    const nodeDefParent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
    if (
      (NodeDef.isMultipleAttribute(nodeDefCurrent) && expr === nodeDefName) ||
      expr === `parent()/${NodeDef.getName(nodeDefParent)}/${nodeDefName}`
    ) {
      unique = true
    } else {
      // do not try to convert uniqueness expression in other cases, it should be converted "manually" into a more complex expression
    }
  } else {
    exprConverted = CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: collectExpr,
    })
  }

  if (StringUtils.isNotBlank(collectApplyIf)) {
    applyIfConverted = CollectExpressionConverter.convert({
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

export const parseValidationRules = ({ survey, nodeDef, collectValidationRules, defaultLanguage }) => {
  const validationRules = []
  const importIssues = []
  let unique = false

  collectValidationRules.forEach((collectValidationRule) => {
    const parseResult = parseValidationRule({ survey, collectValidationRule, nodeDef, defaultLanguage })
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
  })
  return { validationRules, importIssues, unique }
}
