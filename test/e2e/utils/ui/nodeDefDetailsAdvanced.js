import { $, click, getElement, toRightOf, within, writeIntoTextBox } from '../api'
import { writeIntoEl } from '../api/textBox'

const selectorsAdvanced = {
  // common
  expressionsContainer: ({ toRightOfLabel }) => $('.node-def-edit__expressions', toRightOf(toRightOfLabel)),
  expressionContainer: ({ parentSelector, position }) =>
    $(`.node-def-edit__expression:nth-child(${position})`, within(parentSelector)),
  expressionPlaceholder: ({ parentSelector }) => $('.node-def-edit__expression.placeholder', within(parentSelector)),
  expressionPlaceholderEditBtn: ({ parentSelector }) =>
    $(
      '.expression-item:nth-child(1) .expression-editor__query-container .btn-edit',
      within(selectorsAdvanced.expressionPlaceholder({ parentSelector }))
    ),

  // default values
  defaultValueExpressions: () => selectorsAdvanced.expressionsContainer({ toRightOfLabel: 'Default values' }),
  defaultValuePlaceholderExpressionEditBtn: () =>
    selectorsAdvanced.expressionPlaceholderEditBtn({
      parentSelector: selectorsAdvanced.defaultValueExpressions(),
    }),
  defaultValueExpression: ({ position }) =>
    selectorsAdvanced.expressionContainer({ parentSelector: selectorsAdvanced.defaultValueExpressions(), position }),

  // relevant if
  relevantIfExpressions: () => selectorsAdvanced.expressionsContainer({ toRightOfLabel: 'Relevant if' }),
  relevantIfPlaceholderEditBtn: () =>
    selectorsAdvanced.expressionPlaceholderEditBtn({ parentSelector: selectorsAdvanced.relevantIfExpressions() }),
  relevantIfExpression: () =>
    selectorsAdvanced.expressionContainer({ parentSelector: selectorsAdvanced.relevantIfExpressions(), position: 1 }),
}

const selectorsExpressionEditor = {
  constantValue: () => toRightOf('Const'),
  advancedExpressionInput: () => '.CodeMirror',
}

export const addNodeDefDefaultValue = async ({ constant }) => {
  await click('Advanced')

  await click(selectorsAdvanced.defaultValuePlaceholderExpressionEditBtn())

  await writeIntoTextBox({ text: constant, selector: selectorsExpressionEditor.constantValue() })

  await click('Apply')
}

const _expectExpressionIs = async ({ expressionContainer, expression }) => {
  const expressionEl = await getElement({
    text: expression,
    relativeSelectors: [within(expressionContainer)],
  })
  const exists = await expressionEl.exists()
  await expect(exists).toBeTruthy()
}

export const expectNodeDefDefaultValue = async ({ expression, position = 1 }) => {
  const expressionContainer = await selectorsAdvanced.defaultValueExpression({ position })
  await _expectExpressionIs({ expressionContainer, expression })
}

export const setNodeDefRelevantIf = async ({ expression }) => {
  await click('Advanced')

  await click(selectorsAdvanced.relevantIfPlaceholderEditBtn())

  await click('Advanced')

  await writeIntoEl({ text: expression, selector: selectorsExpressionEditor.advancedExpressionInput() })

  await click('Apply')
}

export const expectNodeDefRelevantIf = async ({ expression }) => {
  const expressionContainer = await selectorsAdvanced.relevantIfExpression()
  await _expectExpressionIs({ expressionContainer, expression })
}
