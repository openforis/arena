import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const markedOptions = {
  headerIds: false,
  mangle: false,
} as any

type ParseMarkdownOptions = {
  openLinksInNewTab?: boolean
}

// applied to the sanitized HTML: any remaining "<a " is an anchor tag (text "<" is escaped)
const addTargetBlankToLinks = (html: string): string =>
  html.replaceAll('<a ', '<a target="_blank" rel="noopener noreferrer" ')

export const parseMarkdown = (
  source: string,
  sanitize: boolean = true,
  { openLinksInNewTab = false }: ParseMarkdownOptions = {}
): string => {
  const parsedSource = marked.parse(source, markedOptions) as unknown as string
  const html = sanitize ? DOMPurify.sanitize(parsedSource) : parsedSource
  return openLinksInNewTab ? addTargetBlankToLinks(html) : html
}
