import { $, click, toRightOf, writeIntoTextBox, waitFor1sec } from '../api'
import { writeIntoEl } from '../api/textBox'

const expressionEditorElId = ({ index = 0, qualifier, type, elType }) =>
  `#expression-editor-${index}-${qualifier}-${type}-${elType}`

const selectorsAdvanced = {
  // default values
  defaultValueExpressionEditBtn: ({ index }) =>
    $(expressionEditorElId({ index, qualifier: 'default-values', type: 'expression', elType: 'edit-btn' })),
  defaultValuePlaceholderExpressionEditBtn: () =>
    $(
      expressionEditorElId({
        index: 'placeholder',
        qualifier: 'default-values',
        type: 'expression',
        elType: 'edit-btn',
      })
    ),
  defaultValueExpressionQuery: ({ index }) =>
    $(expressionEditorElId({ index, qualifier: 'default-values', type: 'expression', elType: 'query' })),
  defaultValueApplyIfEditBtn: ({ index }) =>
    $(expressionEditorElId({ index, qualifier: 'default-values', type: 'applyIf', elType: 'edit-btn' })),
  defaultValueApplyIfQuery: ({ index }) =>
    $(expressionEditorElId({ index, qualifier: 'default-values', type: 'applyIf', elType: 'query' })),

  // relevant if
  relevantIfPlaceholderEditBtn: () =>
    $(expressionEditorElId({ index: 'placeholder', qualifier: 'relevant-if', type: 'expression', elType: 'edit-btn' })),
  relevantIfEditBtn: () =>
    $(expressionEditorElId({ index: '0', qualifier: 'relevant-if', type: 'expression', elType: 'edit-btn' })),
  relevantIfExpressionQuery: () =>
    $(expressionEditorElId({ qualifier: 'relevant-if', type: 'expression', elType: 'query' })),
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

export const addNodeDefBooleanDefaultValue = async ({ defaultValue }) => {
  await click('Advanced')

  await waitFor1sec()
  await click(selectorsAdvanced.defaultValuePlaceholderExpressionEditBtn())

  await waitFor1sec()
  await click(defaultValue)

  await click('Apply')
}

const _expectContainerTextToBe = async ({ container, text }) => {
  await expect(container.exists()).toBeTruthy()
  const containerText = await container.text()
  await expect(containerText).toBe(text)
}

export const expectNodeDefDefaultValue = async ({ expression, index = 0 }) => {
  const container = await selectorsAdvanced.defaultValueExpressionQuery({ index })
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefRelevantIf = async ({ expression, placeholder = true }) => {
  await click('Advanced')

  const editBtnSelector = placeholder
    ? selectorsAdvanced.relevantIfPlaceholderEditBtn()
    : selectorsAdvanced.relevantIfEditBtn()
  await click(editBtnSelector)

  await waitFor1sec()
  await click('Advanced')
  await waitFor1sec()

  await writeIntoEl({ text: expression, selector: selectorsExpressionEditor.advancedExpressionInput() })

  await click('Apply')
}

export const expectNodeDefRelevantIf = async ({ expression }) => {
  const container = await selectorsAdvanced.relevantIfExpressionQuery()
  await _expectContainerTextToBe({ container, text: expression })
}

export const setNodeDefDefaultValueApplyIf = async ({ applyIf, index = 0 }) => {
  await click('Advanced')

  await click(selectorsAdvanced.defaultValueApplyIfEditBtn({ index }))
  await waitFor1sec()
  await click('Advanced')
  await waitFor1sec()

  await writeIntoEl({ text: applyIf, selector: selectorsExpressionEditor.advancedExpressionInput() })

  await click('Apply')
}

export const expectNodeDefDefaultValueApplyIf = async ({ applyIf, index = 0 }) => {
  const container = await selectorsAdvanced.defaultValueApplyIfQuery({ index })
  await _expectContainerTextToBe({ container, text: applyIf })
}
