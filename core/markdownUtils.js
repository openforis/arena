import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export const parseMarkdown = (source, sanitize = true) => {
  const parsedSource = marked.parse(source, {
    // disable deprecated options
    headerIds: false,
    mangle: false,
  })
  if (sanitize) {
    return DOMPurify.sanitize(parsedSource)
  }
  return parsedSource
}
