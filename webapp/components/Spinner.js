import React from 'react'
import PropTypes from 'prop-types'
import { CircularProgress } from '@mui/material'

export const Spinner = (props) => {
  const { size } = props

  return <CircularProgress size={size} />
}

Spinner.propTypes = {
  size: PropTypes.number,
}

Spinner.defaultProps = {
  size: 40,
}
