import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'
import { ButtonIconEdit } from './ButtonIconEdit'
import { ButtonIconView } from './ButtonIconView'

export const ButtonIconEditOrView = (props) => {
  const {
    canEdit,
    label: _label, // ignore label prop
    variant = 'outlined',
    ...otherProps
  } = props
  return canEdit ? (
    <ButtonIconEdit {...otherProps} variant={variant} />
  ) : (
    <ButtonIconView {...otherProps} variant={variant} />
  )
}

ButtonIconEditOrView.propTypes = {
  ...Button.propTypes,
  canEdit: PropTypes.bool.isRequired,
}
