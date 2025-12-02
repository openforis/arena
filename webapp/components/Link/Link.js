import React from 'react'
import MuiLink from '@mui/material/Link'
import PropTypes from 'prop-types'

const isUrlSafe = (url) => url && (url.startsWith('http://') || url.startsWith('https://'))

export const Link = (props) => {
  const { children = null, disabled = false, href, label = undefined } = props
  // Validate href to prevent XSS attacks
  const hrefIsSafe = isUrlSafe(href)
  const safeHref = !disabled && hrefIsSafe ? href : undefined

  return (
    <MuiLink href={safeHref} target="_blank" rel="noopener noreferrer">
      {children ?? label ?? href}
    </MuiLink>
  )
}

Link.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  href: PropTypes.string.isRequired,
  label: PropTypes.string,
}
