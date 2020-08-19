import { $, clear, evaluate, into, text as textTaiko, textBox, write } from 'taiko'

// ====== Click
export const clickElement = async (element) =>
  evaluate(element, (el) => {
    el.click()
  })

export const clickParentElement = async (element) =>
  evaluate(element, (el) => {
    el.parentNode.click()
  })

// ====== input elements
export const clearTextBox = async ({ selector }) => clear(textBox(selector))

export const writeIntoTextBox = async ({ text, selector }) => write(text, into(textBox(selector)))

// ====== Tests
export const expectExists = async ({ text = null, selector = null }) => {
  if (!text && !selector) throw new Error('One between text and selector is required')

  const element = text ? textTaiko(text) : $(selector)

  const exists = await element.exists()
  await expect(exists).toBeTruthy()
}
