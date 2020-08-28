import { $, text as textTaiko } from 'taiko'

export const getElement = async ({ text = null, selector = null, itemSelector = null }) => {
  if (!text && !selector && !itemSelector) throw new Error('One between text, selector and itemSelector is required')
  return itemSelector || (text ? textTaiko(text) : $(selector))
}

export const expectExists = async ({ text = null, selector = null, itemSelector = null, numberOfItems = -1 }) => {
  const element = await getElement({ text, selector, itemSelector })

  if (numberOfItems < 0) {
    const exists = await element.exists()
    await expect(exists).toBeTruthy()
  } else {
    const items = await element.elements()
    const _numberOfItems = items.length

    await expect(_numberOfItems).toBe(numberOfItems)
  }
}
