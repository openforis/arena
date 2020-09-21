import { button, click, getElement, toRightOf, waitFor, writeIntoTextBox } from '../api'
import { waitForLoader } from './loader'

const selectors = {
  name: () => toRightOf('Name'),
  label: () => toRightOf('Label'),
  key: () => toRightOf('Key'),
  multiple: () => toRightOf('Multiple'),
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
    await click('Save')
    await waitForLoader()
    await click('Back')
    await waitForLoader()
  }
}

export const clickNodeDefCategoryAdd = async () => {
  await click(button({ class: 'btn-add-category' }))
  await waitFor(1000)
}
