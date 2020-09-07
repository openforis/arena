import { click, getElement, toRightOf, writeIntoTextBox } from '../api'
import { waitForLoader } from './loader'

const selectors = {
  name: () => toRightOf('Name'),
  label: () => toRightOf('Label'),
  key: () => toRightOf('Key'),
  multiple: () => toRightOf('Multiple'),
}

export const addItemToPage = async ({ type, name, label, isKey, isMultiple }) => {
  const pencilIcon = await getElement({ selector: '.icon-pencil2' })
  await click(await getElement({ selector: '.icon-plus' }), toRightOf(pencilIcon))

  await click(type)

  await writeIntoTextBox({ text: name, selector: selectors.name() })
  await writeIntoTextBox({ text: label, selector: selectors.label() })
  if (isKey) {
    await click(await getElement({ selector: '.btn-checkbox' }), selectors.key())
  }
  if (isMultiple) {
    await click(await getElement({ selector: '.btn-checkbox' }), selectors.multiple())
  }
  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
}
