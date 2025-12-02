import React from 'react'
import MuiLink from '@mui/material/Link'
import PropTypes from 'prop-types'

export const Link = (props) => {
  const { children = null, disabled = false, href, label = undefined } = props
  // Validate href to prevent XSS attacks
  const isSafeUrl = href && (href.startsWith('http://') || href.startsWith('https://'))
  const safeHref = isSafeUrl ? href : '#'
  return (
    <MuiLink onClick={disabled ? () => {} : undefined} href={safeHref} target="_blank" rel="noopener noreferrer">
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
