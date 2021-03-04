import { evaluate } from 'taiko'
import { getElement } from './getElement'
import { below } from './below'

export { click } from 'taiko'

export const clickParent = async (selector) => {
  const element = await getElement({ text: selector, relativeSelectors: [below('LABEL')] })
  await evaluate(element, (el) => {
    el.parentNode.click()
  })
}
