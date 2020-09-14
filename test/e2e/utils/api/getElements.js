import { getElement } from './getElement'

export const getElements = async (selector) => {
  const elements = await getElement(selector)
  const items = await elements.elements()
  return items
}
