import React from 'react'
import PropTypes from 'prop-types'

import { Button } from './Button'
import { ButtonIconEdit } from './ButtonIconEdit'
import { ButtonIconView } from './ButtonIconView'

export const ButtonIconEditOrView = (props) => {
  const { canEdit } = props
  return canEdit ? <ButtonIconEdit {...props} /> : <ButtonIconView {...props} />
}

ButtonIconEditOrView.propTypes = {
  ...Button.propTypes,
  canEdit: PropTypes.bool.isRequired,
}

ButtonIconEditOrView.defaultProps = {
  ...Button.defaultProps,
}
