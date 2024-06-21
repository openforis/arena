import React from 'react'
import MuiChip from '@mui/material/Chip'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const Chip = (props) => {
  const { className, label, onDelete, readOnly, variant } = props

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

Chip.defaultProps = {
  readOnly: false,
  onDelete: null,
  variant: 'outlined',
}

export default Chip
