import { $, text as textTaiko } from 'taiko'

export const getElement = async ({ text = null, selector = null, relativeSelectors = [] }) => {
  if (!text && !selector) throw new Error('One between text or selector is required')

  return text ? textTaiko(text, ...relativeSelectors) : $(selector, ...relativeSelectors)
}
