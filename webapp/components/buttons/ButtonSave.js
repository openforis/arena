import React from 'react'
import classNames from 'classnames'

import { Button } from './Button'

export const ButtonSave = (props) => (
  <Button
    {...props}
    className={classNames('btn-primary btn-save', props.className)}
    iconClassName="icon-floppy-disk icon-12px"
  />
)

ButtonSave.propTypes = {
  ...Button.propTypes,
}

ButtonSave.defaultProps = {
  ...Button.defaultProps,
  label: 'common.save',
}
