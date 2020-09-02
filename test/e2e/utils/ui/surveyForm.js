import { click, getElement, toRightOf, writeIntoTextBox } from '../api'
import { waitForLoader } from './loader'

export const addItemToPage = async ({ type, name, label, isKey, isMultiple }) => {
  const pencilIcon = await getElement({ selector: '.icon-pencil2' })
  await click(await getElement({ selector: '.icon-plus' }), toRightOf(pencilIcon))

  await click(type)

  await writeIntoTextBox({ text: name, selector: toRightOf('Name') })
  await writeIntoTextBox({ text: label, selector: toRightOf('Label') })
  if (isKey) {
    await click(await getElement({ selector: '.btn-checkbox' }), toRightOf('Key'))
  }
  if (isMultiple) {
    await click(await getElement({ selector: '.btn-checkbox' }), toRightOf('Multiple'))
  }
  await click('Save')
  await waitForLoader()
  await click('Back')
  await waitForLoader()
}
