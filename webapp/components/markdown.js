import React, { useState, useEffect } from 'react'
import { marked } from 'marked'

const Markdown = (props) => {
  const { container: Container, className, source } = props
  const [output, setOutput] = useState('')

  useEffect(() => {
    setOutput(marked.parse(source))
  }, [source])

  return <Container className={className} dangerouslySetInnerHTML={{ __html: output }} />
}

Markdown.defaultProps = {
  source: '', // Markdown text to render
  container: 'div', // The container element to use
  className: '', // The class name to apply to the container element
}

export default Markdown
