import * as StringUtils from '@core/stringUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import * as CollectSurvey from '../../model/collectSurvey'
import { CollectExpressionConverter } from './collectExpressionConverter'

const parseConstantValue = ({ survey, nodeDef, value }) => {
  if (NodeDef.isBoolean(nodeDef)) {
    const valueConverted = CollectExpressionConverter.convert({ survey, nodeDefCurrent: nodeDef, expression: value })
    return valueConverted ? JSON.stringify(valueConverted.trim()) : null
  }
  return JSON.stringify(value)
}

const parseDefaultValue = ({ survey, collectDefaultValue, nodeDef, defaultLanguage }) => {
  const { value, expr: collectExpr, if: collectApplyIf } = CollectSurvey.getAttributes(collectDefaultValue)

  if (StringUtils.isBlank(value) && StringUtils.isBlank(collectExpr)) {
    // empty default value, skip it
    this.logDebug('empty value found in node def default value constant value and expression')
    return null
  }

  const exprConverted = StringUtils.isNotBlank(value)
    ? parseConstantValue({ survey, nodeDef, value })
    : CollectExpressionConverter.convert({
        survey,
        nodeDefCurrent: nodeDef,
        expression: collectExpr,
      })

  const applyIfConverted = StringUtils.isNotBlank(collectApplyIf)
    ? CollectExpressionConverter.convert({
        survey,
        nodeDefCurrent: nodeDef,
        expression: collectApplyIf,
      })
    : ''

  const success = exprConverted !== null && (StringUtils.isBlank(collectApplyIf) || applyIfConverted !== null)

  // if expression has been converted without errors, mark the import issue as resolved
  const importIssue = CollectImportReportItem.newReportItem({
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    expressionType: CollectImportReportItem.exprTypes.defaultValue,
    expression: StringUtils.isNotBlank(value) ? value : collectExpr,
    applyIf: collectApplyIf,
    messages: CollectSurvey.toLabels('messages', defaultLanguage)(collectDefaultValue),
    resolved: success,
  })

  return {
    importIssue,
    defaultValue: success
      ? NodeDefExpression.createExpression(exprConverted, applyIfConverted === null ? '' : applyIfConverted)
      : null,
  }
}

export const parseDefaultValues = ({ survey, nodeDef, collectDefaultValues, defaultLanguage }) => {
  const defaultValues = []
  const importIssues = []

  collectDefaultValues.forEach((collectDefaultValue) => {
    const parseResult = parseDefaultValue({ survey, collectDefaultValue, nodeDef, defaultLanguage })
    if (parseResult) {
      const { defaultValue, importIssue } = parseResult
      if (defaultValue) {
        defaultValues.push(defaultValue)
      }
      importIssues.push(importIssue)
    }
  })

  return { defaultValues, importIssues }
}
