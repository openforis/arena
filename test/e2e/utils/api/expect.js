import { $, text as textTaiko } from 'taiko'

export const getSelection = async ({ text = null, selector = null, itemSelector = null }) => {
  if (!text && !selector && !itemSelector) throw new Error('One between text, selector and itemSelector is required')

  const element = await (itemSelector || (text ? textTaiko(text) : $(selector)))

  return element
}

export const expectExists = async ({ text = null, selector = null, itemSelector = null }) => {
  const element = await getSelection({ text, selector, itemSelector })

  const exists = await element.exists()
  await expect(exists).toBeTruthy()
}

export const expectExistsExactlyNumberOfTimes = async ({
  text = null,
  selector = null,
  itemSelector = null,
  numberOfItems = 0,
}) => {
  const element = await getSelection({ text, selector, itemSelector })
  const items = await element.elements()
  const _numberOfItems = items.length

  await expect(_numberOfItems).toBe(numberOfItems)
}
