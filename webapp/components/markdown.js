import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { marked } from 'marked'

const Markdown = (props) => {
  const { container: Container = 'div', className = undefined, source } = props

  const [output, setOutput] = useState('')

  useEffect(() => {
    setOutput(
      marked.parse(source, {
        // disable deprecated options
        headerIds: false,
        mangle: false,
      })
    )
  }, [source])

  return <Container className={className} dangerouslySetInnerHTML={{ __html: output }} />
}

Markdown.propTypes = {
  source: PropTypes.string.isRequired, // Markdown text to render
  container: PropTypes.string, // The container element to use
  className: PropTypes.string, // The class name to apply to the container element
}

export default Markdown
