import React from 'react'

import { ButtonProps } from './Button'
import { ButtonIconEdit } from './ButtonIconEdit'
import { ButtonIconView } from './ButtonIconView'

type ButtonIconEditOrViewProps = ButtonProps & {
  canEdit: boolean
}

export const ButtonIconEditOrView = (props: ButtonIconEditOrViewProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { canEdit, label: _label, variant = 'outlined', ...otherProps } = props
  return canEdit ? (
    <ButtonIconEdit {...otherProps} variant={variant} />
  ) : (
    <ButtonIconView {...otherProps} variant={variant} />
  )
}
