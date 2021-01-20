import { button, click, expectExists, getElement, textBox, toRightOf, waitFor, writeIntoTextBox } from '../api'
import { waitForLoader } from './loader'

const selectors = {
  name: () => toRightOf('Name'),
  label: () => toRightOf('Label'),
  key: () => toRightOf('Key'),
  multiple: () => toRightOf('Multiple'),
  category: () => toRightOf('Category'),
  parentCode: () => toRightOf('Parent Code'),
}

export const clickNodeDefSaveAndBack = async () => {
  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
}

export const expectNodeDefUnchanged = async () => expectExists({ text: 'Back' })

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
  await waitFor(2000)
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
  await waitFor(2000)
}
