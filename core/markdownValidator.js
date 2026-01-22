import { marked } from 'marked'

export const checkTextHasLinks = (text) => {
  const tokens = marked.lexer(text)
  const stack = [...tokens]

  while (stack.length > 0) {
    const current = stack.pop()

    if (current.type === 'link' || current.type === 'image') {
      return true
    }

    if (current.tokens?.length > 0) {
      stack.push(...current.tokens)
    }
    if (current.items?.length > 0) {
      stack.push(...current.items)
    }
  }
  return false
}
