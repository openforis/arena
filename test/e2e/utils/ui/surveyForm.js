import { expectExists, expectToBe, getElement, getElements } from '../api'

export const expectSurveyFormLoaded = async () => expectExists({ selector: '.survey-form' })

const getNodeDefElementText = async ({ item }) => {
  const itemText = await item.text()
  const text = await itemText.split('\n')[0]
  return text
}

export const expectItemIsTheLastNodeDef = async ({ item }) => {
  const items = await getElements({ selector: '.survey-form__node-def-page-item' })

  const last = items[items.length - 1]

  const itemText = await getNodeDefElementText({ item: last })
  await expect(itemText).toBe(item.label.toUpperCase())
}

const expectItemsInOrder = async ({ items, expectedItems }) =>
  Promise.all(
    items.map(async (item, index) => {
      const itemText = await getNodeDefElementText({ item })
      await expect(itemText).toBe(expectedItems[index].label.toUpperCase())
    })
  )

const expectItemsAreInOrder = async ({ items: expectedItems, selector }) => {
  const items = await getElements({ selector })
  await expectToBe({ selector, numberOfItems: items.length })
  await expectItemsInOrder({ items, expectedItems })
}

export const expectSurveyFormItemsAreInOrder = async ({ items }) => {
  const gridWrapper = await getElement({ selector: '.survey-form__node-def-entity-form-grid-wrapper' })
  const nodeDefNamesOrderedAttribute = await gridWrapper.attribute('data-child-names')
  const nodeDefNamesOrdered = nodeDefNamesOrderedAttribute.split(',')
  const nodeDefNamesExpected = items.map((item) => item.name)
  await expect(nodeDefNamesOrdered).toStrictEqual(nodeDefNamesExpected)
}

export const expectSurveyFormEntityItemsAreInOrder = async ({ items }) =>
  expectItemsAreInOrder({
    items,
    selector: '.survey-form__node-def-entity-table-rows .survey-form__node-def-page-item',
  })
