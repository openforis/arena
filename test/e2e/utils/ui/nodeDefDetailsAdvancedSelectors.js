import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import { $ } from '../api'

const expressionQualifier = {
  defaultValues: 'default-values',
  relevantIf: 'relevant-if',
}

const expressionEditorEl = ({ index = 0, qualifier, type, elType }) =>
  $(`#expression-editor-${index}-${qualifier}-${type}-${elType}`)

export const nodeDefDetailsAdvancedSelectors = {
  defaultValuesTooltip: ({ error = false } = {}) =>
    `.node-def-edit__expressions-default-values-tooltip${error ? '.tooltip-error' : ''}`,
}

export const nodeDefDetailsAdvancedElements = {
  // default values
  defaultValuesTooltip: ({ error = false } = {}) =>
    $(`.node-def-edit__expressions-default-values-tooltip${error ? '.tooltip-error' : ''}`),
  defaultValueExpressionEditBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.expression,
      elType: 'edit-btn',
    }),
  defaultValueExpressionDeleteBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.expression,
      elType: 'btn-delete',
    }),
  defaultValuePlaceholderExpressionEditBtn: () =>
    expressionEditorEl({
      index: 'placeholder',
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.expression,
      elType: 'edit-btn',
    }),
  defaultValueExpressionQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.expression,
      elType: 'query',
    }),
  defaultValueApplyIfEditBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.applyIf,
      elType: 'edit-btn',
    }),
  defaultValueApplyIfQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.applyIf,
      elType: 'query',
    }),
  // relevant if
  relevantIfPlaceholderEditBtn: () =>
    expressionEditorEl({
      index: 'placeholder',
      qualifier: expressionQualifier.relevantIf,
      type: NodeDefExpression.keys.expression,
      elType: 'edit-btn',
    }),
  relevantIfEditBtn: () =>
    expressionEditorEl({
      index: '0',
      qualifier: expressionQualifier.relevantIf,
      type: NodeDefExpression.keys.expression,
      elType: 'edit-btn',
    }),
  relevantIfExpressionQuery: () =>
    expressionEditorEl({
      qualifier: expressionQualifier.relevantIf,
      type: NodeDefExpression.keys.expression,
      elType: 'query',
    }),
}
