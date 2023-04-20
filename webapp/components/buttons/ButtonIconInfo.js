import React from 'react'
import classNames from 'classnames'
import { Tooltip } from '@mui/material'

import { useI18n } from '@webapp/store/system'

import { Button } from './Button'

export const ButtonIconInfo = (props) => {
  const { className: classNameProp, title, ...otherProps } = props

  const i18n = useI18n()
  const className = classNames('btn-transparent', classNameProp)

  return (
    <Tooltip title={i18n.t(title)}>
      <Button {...otherProps} className={className} iconClassName="icon-info icon-14px" />
    </Tooltip>
  )
}

ButtonIconInfo.propTypes = {
  ...Button.propTypes,
}

ButtonIconInfo.defaultProps = {
  ...Button.defaultProps,
}
