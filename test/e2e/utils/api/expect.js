import { getElement } from './getElement'

export const expectExists = async ({ text = null, selector = null, numberOfItems = -1 }) => {
  const element = await getElement({ text, selector })

  if (numberOfItems < 0) {
    const exists = await element.exists()
    await expect(exists).toBeTruthy()
  } else {
    const items = await element.elements()
    const _numberOfItems = items.length

    await expect(_numberOfItems).toBe(numberOfItems)
  }
}
