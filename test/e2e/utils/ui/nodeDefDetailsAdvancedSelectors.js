import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import { $ } from '../api'

const placeholderIndex = 'placeholder'

const expressionQualifier = {
  defaultValues: 'default-values',
  relevantIf: 'relevant-if',
  validations: 'validations',
}

const elementType = {
  editBtn: 'edit-btn',
  deleteBtn: 'btn-delete',
  query: 'query',
}

const expressionEditorEl = ({ index = 0, qualifier, type = NodeDefExpression.keys.expression, elType }) =>
  $(`#expression-editor-${index}-${qualifier}-${type}-${elType}`)

export const nodeDefDetailsAdvancedSelectors = {
  defaultValuesTooltip: ({ error = false } = {}) =>
    `.node-def-edit__expressions-default-values-tooltip${error ? '.tooltip-error' : ''}`,
}

export const nodeDefDetailsAdvancedElements = {
  // default values
  defaultValueExpressionEditBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      elType: elementType.editBtn,
    }),
  defaultValueExpressionDeleteBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      elType: elementType.deleteBtn,
    }),
  defaultValuePlaceholderExpressionEditBtn: () =>
    expressionEditorEl({
      index: placeholderIndex,
      qualifier: expressionQualifier.defaultValues,
      elType: elementType.editBtn,
    }),
  defaultValueExpressionQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      elType: elementType.query,
    }),
  defaultValueApplyIfEditBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.editBtn,
    }),
  defaultValueApplyIfQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.defaultValues,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.query,
    }),
  // relevant if
  relevantIfPlaceholderEditBtn: () =>
    expressionEditorEl({
      index: placeholderIndex,
      qualifier: expressionQualifier.relevantIf,
      elType: elementType.editBtn,
    }),
  relevantIfEditBtn: () =>
    expressionEditorEl({
      index: '0',
      qualifier: expressionQualifier.relevantIf,
      elType: elementType.editBtn,
    }),
  relevantIfExpressionQuery: () =>
    expressionEditorEl({
      qualifier: expressionQualifier.relevantIf,
      elType: elementType.query,
    }),
  // validations
  validationsExpressionItems: () =>
    $('.node-def-edit__expressions-validations-tooltip .node-def-edit__expressions .node-def-edit__expression'),
  validationExpressionPlaceholderEditBtn: () =>
    expressionEditorEl({
      index: placeholderIndex,
      qualifier: expressionQualifier.validations,
      elType: elementType.editBtn,
    }),
  validationExpressionEditBtn: () =>
    expressionEditorEl({
      qualifier: expressionQualifier.validations,
      elType: elementType.editBtn,
    }),
  validationApplyIfEditBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.validations,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.editBtn,
    }),
  validationExpressionQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.validations,
      elType: elementType.query,
    }),
  validationApplyIfQuery: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.validations,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.query,
    }),
  validationDeleteBtn: ({ index }) =>
    expressionEditorEl({
      index,
      qualifier: expressionQualifier.validations,
      elType: elementType.deleteBtn,
    }),
}
