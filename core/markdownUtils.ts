import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const markedOptions = {
  headerIds: false,
  mangle: false,
} as any

export const parseMarkdown = (source: string, sanitize: boolean = true): string => {
  const parsedSource = marked.parse(source, markedOptions) as unknown as string
  return sanitize ? DOMPurify.sanitize(parsedSource) : parsedSource
}
