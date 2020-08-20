import { evaluate } from 'taiko'

export { click } from 'taiko'

export const clickParent = async (selector) =>
  evaluate(selector, (element) => {
    element.parentNode.click()
  })
