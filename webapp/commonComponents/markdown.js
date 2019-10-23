import React, { useState, useEffect } from 'react'
import marked from 'marked'

const Markdown = props => {
  const { container: Container, className, source } = props
  const [output, setOutput] = useState('')

  useEffect(() => {
    setOutput(marked(source))
  }, [source])

  return (
    <Container className={className} dangerouslySetInnerHTML={{ __html: output }}/>
  )
}

Markdown.defaultProps = {
  source: '', // markdown text to render
  container: 'div', // the container element to use
  className: '', // the class name to apply to the container element
}

export default Markdown