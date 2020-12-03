import {
  $,
  button,
  click,
  expectExists,
  getElement,
  textBox,
  toRightOf,
  waitFor,
  within,
  writeIntoTextBox,
} from '../api'
import { writeIntoEl } from '../api/textBox'
import { waitForLoader } from './loader'

const selectors = {
  name: () => toRightOf('Name'),
  label: () => toRightOf('Label'),
  key: () => toRightOf('Key'),
  multiple: () => toRightOf('Multiple'),
  category: () => toRightOf('Category'),
  parentCode: () => toRightOf('Parent Code'),
}

const selectorsAdvanced = {
  defaultValuePlaceholderEditBtn: () =>
    $(
      '.node-def-edit__expression.placeholder .expression-editor__query-container .btn-edit',
      toRightOf('Default values')
    ),
  defaultValueExpression: ({ position }) =>
    $(`.node-def-edit__expressions .node-def-edit__expression:nth-child(${position})`, toRightOf('Default values')),
  relevantIfPlaceholderEditBtn: () =>
    $('.node-def-edit__expression.placeholder .expression-editor__query-container .btn-edit', toRightOf('Relevant if')),
  relevantIfExpression: () => $('.node-def-edit__expressions .node-def-edit__expression', toRightOf('Relevant if')),
}

const selectorsExpressionEditor = {
  constantValue: () => toRightOf('Const'),
  advancedExpressionInput: () => '.CodeMirror',
}

export const clickNodeDefSaveAndBack = async () => {
  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
}

export const addItemToPage = async ({
  type,
  name,
  label,
  isKey,
  isMultiple,
  addButtonSelector = '.survey-form__node-def-edit-buttons .icon-plus',
  saveAndBack = true,
}) => {
  await click(await getElement({ selector: addButtonSelector }))

  await click(type)

  await writeIntoTextBox({ text: name, selector: selectors.name() })
  await writeIntoTextBox({ text: label, selector: selectors.label() })
  if (isKey) {
    await click(await getElement({ selector: '.btn-checkbox' }), selectors.key())
  }
  if (isMultiple) {
    await click(await getElement({ selector: '.btn-checkbox' }), selectors.multiple())
  }
  if (saveAndBack) {
    await clickNodeDefSaveAndBack()
  }
}

export const addNodeDefToTable = async ({ type, name, label, isKey, isMultiple, saveAndBack = true }) =>
  addItemToPage({
    type,
    name,
    label,
    isKey,
    isMultiple,
    saveAndBack,
    addButtonSelector: '.survey-form__node-def-page-item .icon-plus',
  })

export const clickNodeDefCategoryAdd = async () => {
  await click(button({ class: 'btn-add-category' }))
  await waitFor(1000)
}

export const expectNodeDefCategoryIs = async (categoryName) => expectExists({ text: categoryName })

const _openNodeDefCategoryDropdown = async () => click(textBox(selectors.category()))

export const selectNodeDefCategory = async ({ category }) => {
  await _openNodeDefCategoryDropdown()
  await click(category)
}

const _openNodeDefCodeParentDropdown = async () => click(textBox(selectors.parentCode()))
const _closeNodeDefCodeParentDropdown = async () => click('Parent code')

export const expectNodeDefCodeParentItems = async ({ items: itemsExpected }) => {
  await _openNodeDefCodeParentDropdown()
  const items = await (await getElement({ selector: `.autocomplete-list div` })).elements()
  const itemLabels = await Promise.all(items.map((item) => item.text()))
  await expect(itemLabels).toStrictEqual(itemsExpected)
  await _closeNodeDefCodeParentDropdown()
}

export const selectNodeDefCodeParent = async ({ nodeDefName }) => {
  await _openNodeDefCodeParentDropdown()
  await click(nodeDefName)
}

const _isNodeDefCodeParentDisabled = async () => textBox(selectors.parentCode()).isDisabled()

export const expectNodeDefCodeParentDisabled = async () => expect(await _isNodeDefCodeParentDisabled()).toBeTruthy()

export const expectNodeDefCodeParentEnabled = async () => expect(await _isNodeDefCodeParentDisabled()).toBeFalsy()

export const clickNodeDefTaxonomyAdd = async () => {
  await click(button({ class: 'btn-add-taxonomy' }))
  await waitFor(1000)
}

export const addNodeDefDefaultValue = async ({ constant }) => {
  await click('Advanced')

  await click(selectorsAdvanced.defaultValuePlaceholderEditBtn())

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
