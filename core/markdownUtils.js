import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export const parseMarkdown = (source) => {
  const parsedSource = marked.parse(source, {
    // disable deprecated options
    headerIds: false,
    mangle: false,
  })
  return DOMPurify.sanitize(parsedSource)
}

export const checkTextHasLinks = (text) => {
  const tokens = marked.lexer(text)
  const stack = [...tokens]

  while (stack.length > 0) {
    const current = stack.pop()

    if (current.type === 'link') {
      return true
    }

    if (current.tokens?.length > 0) {
      stack.push(...current.tokens)
    }
  }
  return false
}
