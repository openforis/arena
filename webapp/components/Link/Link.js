import React from 'react'
import MuiLink from '@mui/material/Link'
import PropTypes from 'prop-types'

export const Link = (props) => {
  const { disabled = false, href, label = undefined } = props
  return (
    <MuiLink onClick={disabled ? () => {} : undefined} href={href} target="_blank" rel="noopener noreferrer">
      {label ?? href}
    </MuiLink>
  )
}

Link.propTypes = {
  disabled: PropTypes.bool,
  href: PropTypes.string.isRequired,
  label: PropTypes.string,
}
