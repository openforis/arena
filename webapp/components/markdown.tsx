import { type JSX, useMemo } from 'react'

import { parseMarkdown } from '@core/markdownUtils'

type MarkdownProps = {
  source: string // Markdown text to render
  container?: keyof JSX.IntrinsicElements // The container element to use
  className?: string // The class name to apply to the container element
  sanitize?: boolean // Whether to sanitize the HTML output
  openLinksInNewTab?: boolean // Whether links open in a new browser tab
}

const Markdown = (props: MarkdownProps) => {
  const {
    container: Container = 'div',
    className = undefined,
    source,
    sanitize = true,
    openLinksInNewTab = false,
  } = props

  const output = useMemo(
    () => parseMarkdown(source, sanitize, { openLinksInNewTab }),
    [source, sanitize, openLinksInNewTab]
  )

  return <Container className={className} dangerouslySetInnerHTML={{ __html: output }} />
}

export default Markdown
