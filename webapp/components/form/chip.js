import React from 'react'
import MuiChip from '@mui/material/Chip'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const Chip = (props) => {
  const { className, onDelete = null, label, readOnly = false, variant = 'outlined' } = props

  return (
    <MuiChip
      className={classNames(className)}
      onDelete={!readOnly ? onDelete : undefined}
      label={label}
      variant={variant}
    />
  )
}

Chip.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  onDelete: PropTypes.func,
  variant: PropTypes.oneOf(['filled', 'outlined']),
}

export default Chip
