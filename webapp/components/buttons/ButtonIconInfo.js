import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonIconInfo = (props) => {
  const { className: classNameProp, ...otherProps } = props

  const className = classNames('btn-info', classNameProp)

  return <Button {...otherProps} className={className} iconClassName="icon-info icon-14px" />
}

ButtonIconInfo.propTypes = {
  ...Button.propTypes,
}

ButtonIconInfo.defaultProps = {
  ...Button.defaultProps,
  variant: 'text',
}
