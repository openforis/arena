import { getElement } from './getElement'

export const expectExists = async ({ text = null, selector = null }) => {
  const element = await getElement({ text, selector })
  const exists = await element.exists()
  await expect(exists).toBeTruthy()
}

export const expectNotExists = async ({ text = null, selector = null }) => {
  const element = await getElement({ text, selector })
  const exists = await element.exists(0, 0)
  await expect(exists).toBeFalsy()
}

export const expectToBe = async ({ text = null, selector = null, numberOfItems = 1 }) => {
  const element = await getElement({ text, selector })
  const items = await element.elements()
  const _numberOfItems = items.length
  await expect(_numberOfItems).toBe(numberOfItems)
}
