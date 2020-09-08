import { expectExists, expectToBe, getElement } from '../api'

export const expectSurveyFormLoaded = async () => expectExists({ selector: '.survey-form' })

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

  await expectToBe({
    selector: '.survey-form__node-def-page-item',
    numberOfItems: items.length,
  })

  await Promise.all(
    items.map(async (item, index) => {
      const itemText = await getNodeDefElementText({ item })
      await expect(itemText).toBe(nodeDefItems[index].label.toUpperCase())
    })
  )
}
