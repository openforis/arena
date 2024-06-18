import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'
import { ButtonIconEdit } from './ButtonIconEdit'
import { ButtonIconView } from './ButtonIconView'

export const ButtonIconEditOrView = (props) => {
  const {
    canEdit,
    label: _label, // ignore label prop
    ...otherProps
  } = props
  return canEdit ? <ButtonIconEdit {...otherProps} /> : <ButtonIconView {...otherProps} />
}

ButtonIconEditOrView.propTypes = {
  ...Button.propTypes,
  canEdit: PropTypes.bool.isRequired,
}

ButtonIconEditOrView.defaultProps = {
  ...Button.defaultProps,
  showLabel: true,
  variant: 'outlined',
}
