import { clear, into, textBox, write } from 'taiko'

export const clearTextBox = async ({ selector }) => clear(textBox(selector))

export const writeIntoTextBox = async ({ text, selector }) => write(text, into(textBox(selector)))
