import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import { parseMarkdown } from '@core/markdownUtils'

const Markdown = (props) => {
  const { container: Container = 'div', className = undefined, source } = props

  const [output, setOutput] = useState('')

  useEffect(() => {
    const parsedSource = parseMarkdown(source)
    setOutput(parsedSource)
  }, [source])

  return <Container className={className} dangerouslySetInnerHTML={{ __html: output }} />
}

Markdown.propTypes = {
  source: PropTypes.string.isRequired, // Markdown text to render
  container: PropTypes.string, // The container element to use
  className: PropTypes.string, // The class name to apply to the container element
}

export default Markdown
