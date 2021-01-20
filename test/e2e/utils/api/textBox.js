import { clear, into, textBox, write, hover, $, evaluate } from 'taiko'

export const clearTextBox = async ({ selector }) => clear(textBox(selector))
export const hoverTextBox = async ({ selector }) => hover(textBox(selector))

export const writeIntoTextBox = async ({ text, selector, clearBefore = false }) => {
  if (clearBefore) {
    // await clearTextBox({ selector })
    // clear is replaced by this select in order to replace default values
    await evaluate(textBox(selector), (element) => element.select())
  }

  await write(text, into(textBox(selector)))
}

export const writeIntoEl = ({ text, element, selector }) => write(text, into(element || $(selector)))

export { textBox }
