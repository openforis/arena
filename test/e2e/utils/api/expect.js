import { textBox } from './textBox'
import { getElement } from './getElement'

export const expectExists = async ({ text = null, selector = null, relativeSelectors = [] }) => {
  const element = await getElement({ text, selector, relativeSelectors })
  const exists = await element.exists()
  await expect(exists).toBeTruthy()
}

export const expectNotExists = async ({ text = null, selector = null, relativeSelectors = [] }) => {
  const element = await getElement({ text, selector, relativeSelectors })
  const exists = await element.exists(0, 0)
  await expect(exists).toBeFalsy()
}

export const expectToBe = async ({ text = null, selector = null, relativeSelectors = [], numberOfItems = 1 }) => {
  const element = await getElement({ text, selector, relativeSelectors })
  const items = await element.elements()
  const _numberOfItems = items.length
  await expect(_numberOfItems).toBe(numberOfItems)
}

export const expectInputTextToBe = async ({ expectedText, selector = null, relativeSelectors = [] }) => {
  const inputField = textBox(selector, ...relativeSelectors)
  const exists = await inputField.exists()
  await expect(exists).toBeTruthy()
  const text = await inputField.value()
  await expect(text).toBe(expectedText)
}
