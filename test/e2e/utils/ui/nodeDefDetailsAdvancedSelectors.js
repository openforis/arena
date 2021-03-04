import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import { $ } from '../api'

export const placeholderIndex = 'placeholder'

export const qualifiers = {
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
  expressionEditorsWrapperInvalid: ({ qualifier }) => `.node-def-edit__expressions-${qualifier}-tooltip.tooltip-error`,
}

export const expressionEditorElements = {
  expressionItems: ({ qualifier }) =>
    $(`.node-def-edit__expressions-${qualifier}-tooltip .node-def-edit__expressions .node-def-edit__expression`),
  expressionEditBtn: ({ qualifier, index }) =>
    expressionEditorEl({
      qualifier,
      index,
      elType: elementType.editBtn,
    }),
  deleteBtn: ({ qualifier, index }) =>
    expressionEditorEl({
      qualifier,
      index,
      elType: elementType.deleteBtn,
    }),
  expressionQuery: ({ qualifier, index }) =>
    expressionEditorEl({
      qualifier,
      index,
      elType: elementType.query,
    }),
  applyIfEditBtn: ({ qualifier, index }) =>
    expressionEditorEl({
      qualifier,
      index,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.editBtn,
    }),
  applyIfQuery: ({ qualifier, index }) =>
    expressionEditorEl({
      qualifier,
      index,
      type: NodeDefExpression.keys.applyIf,
      elType: elementType.query,
    }),
}
