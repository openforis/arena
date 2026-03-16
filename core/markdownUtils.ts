import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const markedOptions = {
  headerIds: false,
  mangle: false,
} as any

export const parseMarkdown = (source: string): string => {
  const parsedSource = marked.parse(source, markedOptions) as unknown as string
  return DOMPurify.sanitize(parsedSource)
}
