import { clear, into, textBox, write, hover, $ } from 'taiko'

export const clearTextBox = async ({ selector }) => clear(textBox(selector))
export const hoverTextBox = async ({ selector }) => hover(textBox(selector))

export const writeIntoTextBox = async ({ text, selector }) => write(text, into(textBox(selector)))
export const writeIntoEl = ({ text, element, selector }) => write(text, into(element || $(selector)))

export { textBox }
