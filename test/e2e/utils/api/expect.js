import { $, text as textTaiko } from 'taiko'

export const expectExists = async ({ text = null, selector = null }) => {
  if (!text && !selector) throw new Error('One between text and selector is required')

  const element = text ? textTaiko(text) : $(selector)

  const exists = await element.exists()
  await expect(exists).toBeTruthy()
}
