import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonNew = (props) => (
  <Button
    {...props}
    className={classNames('btn-primary btn-new', props.className)}
    iconClassName="icon-plus icon-12px icon-left"
  />
)

ButtonNew.propTypes = {
  ...Button.propTypes,
}

ButtonNew.defaultProps = {
  ...Button.defaultProps,
  label: 'common.new',
}
