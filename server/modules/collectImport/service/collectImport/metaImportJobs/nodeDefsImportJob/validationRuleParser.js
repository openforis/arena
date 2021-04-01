import * as StringUtils from '@core/stringUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import * as CollectSurvey from '../../model/collectSurvey'
import { CollectExpressionConverter } from './collectExpressionConverter'

const collectCheckType = {
  check: 'check',
  compare: 'compare',
  distance: 'distance',
  pattern: 'pattern',
  unique: 'unique',
}

const checkExpressionParserByType = {
  [collectCheckType.compare]: (collectCheck) => {
    const attributeToOperator = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
    }
    const attributes = CollectSurvey.getAttributes(collectCheck)
    const exprParts = Object.entries(attributes).reduce((accParts, [attrName, attribute]) => {
      const operator = attributeToOperator[attrName]
      if (operator) {
        accParts.push(`$this ${operator} ${attribute}`)
      }
      return accParts
    }, [])

    return exprParts.join(' and ')
  },
  [collectCheckType.check]: (collectCheck) => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
  [collectCheckType.distance]: (collectCheck) => {
    const { max, to } = CollectSurvey.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  [collectCheckType.pattern]: (collectCheck) => {
    const { regex } = CollectSurvey.getAttributes(collectCheck)
    return `$this must respect the pattern: ${regex}`
  },
  [collectCheckType.unique]: (collectCheck) => {
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
  const collectExpr = checkExpressionParser(collectValidationRule)

  if (StringUtils.isBlank(collectExpr)) {
    // empty expression
    return null
  }

  const { if: collectApplyIf, flag } = CollectSurvey.getAttributes(collectValidationRule)

  let exprConverted = null
  let applyIfConverted = null

  if (checkType === collectCheckType.distance) {
    const { max, to } = CollectSurvey.getAttributes(collectValidationRule)
    const toExprConverted = CollectExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      expression: to,
    })
    if (toExprConverted) {
      exprConverted = `distance(${NodeDef.getName(nodeDefCurrent)}, ${toExprConverted}) <= ${max}`
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

  const success = exprConverted !== null && (StringUtils.isBlank(collectApplyIf) || applyIfConverted !== null)

  // if expression has been converted without errors, mark the import issue as resolved
  const importIssue = CollectImportReportItem.newReportItem({
    nodeDefUuid: NodeDef.getUuid(nodeDefCurrent),
    expressionType:
      flag === 'error'
        ? CollectImportReportItem.exprTypes.validationRuleError
        : CollectImportReportItem.exprTypes.validationRuleWarning,
    expression: collectExpr,
    applyIf: collectApplyIf,
    messages: CollectSurvey.toLabels('message', defaultLanguage)(collectValidationRule),
    resolved: success,
  })

  return {
    validationRule: success
      ? NodeDefExpression.createExpression(exprConverted, applyIfConverted === null ? '' : applyIfConverted)
      : null,
    importIssue,
  }
}

export const parseValidationRules = ({ survey, nodeDef, collectValidationRules, defaultLanguage }) => {
  const validationRules = []
  const importIssues = []

  collectValidationRules.forEach((collectValidationRule) => {
    const parseResult = parseValidationRule({ survey, collectValidationRule, nodeDef, defaultLanguage })
    if (parseResult) {
      const { validationRule, importIssue } = parseResult
      if (validationRule) {
        validationRules.push(validationRule)
      }
      importIssues.push(importIssue)
    }
  })
  return { validationRules, importIssues }
}
