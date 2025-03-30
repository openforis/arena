import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonIconInfo = (props) => {
  const { className: classNameProp, variant = 'text', ...otherProps } = props

  const className = classNames('btn-info', classNameProp)

  return <Button {...otherProps} className={className} iconClassName="icon-info icon-14px" variant={variant} />
}

ButtonIconInfo.propTypes = {
  ...Button.propTypes,
}
