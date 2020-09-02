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

const getNodeDefElementText = async ({ item }) => {
  const itemText = await item.text()
  const text = await itemText.split('\n')[0]
  return text
}

const getNodeDefElements = async () => {
  const elements = await getElement({ selector: '.survey-form__node-def-page-item' })
  const items = await elements.elements()
  return items
}

export const expectItemIsTheLastNodeDef = async ({ item }) => {
  const items = await getNodeDefElements()

  const last = items[items.length - 1]

  const itemText = await getNodeDefElementText({ item: last })
  await expect(itemText).toBe(item.label.toUpperCase())
}

export const expectItemsAreInOrderAsNodeDef = async ({ items: nodeDefItems }) => {
  const items = await getNodeDefElements()

  await items.map(async (item, index) => {
    const itemText = await getNodeDefElementText({ item })
    await expect(itemText).toBe(nodeDefItems[index].label.toUpperCase())
  })
}
