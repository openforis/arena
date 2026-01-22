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
