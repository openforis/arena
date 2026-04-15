import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

const NodeDefKeyLockToggle = (props) => {
  const { className = '', keyFieldLocked = false, onClick = undefined } = props
  const classNameButton = ['survey-form__node-def-key-lock-toggle', className].filter(Boolean).join(' ')

  return (
    <Button
      className={classNameButton}
      iconClassName={keyFieldLocked ? 'icon-lock icon-12px' : 'icon-unlocked icon-12px'}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={`recordView.${keyFieldLocked ? 'unlock' : 'lock'}`}
      showLabel={false}
      size="small"
      variant="text"
    />
  )
}

NodeDefKeyLockToggle.propTypes = {
  className: PropTypes.string,
  keyFieldLocked: PropTypes.bool,
  onClick: PropTypes.func,
}

export default NodeDefKeyLockToggle
