import './NodeDefKeyLockToggle.scss'

import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

const NodeDefKeyLockToggle = (props) => {
  const { className = '', keyFieldLocked = false, onClick = undefined, testId = undefined } = props

  const classNameButton = classNames('survey-form__node-def-key-lock-toggle', className)

  return (
    <Button
      className={classNameButton}
      closeTooltipOnClick
      iconClassName={keyFieldLocked ? 'icon-lock icon-12px' : 'icon-unlocked icon-12px'}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      showLabel={false}
      size="small"
      testId={testId}
      title={`recordView.keyAttributeEditing.${keyFieldLocked ? 'unlock' : 'lock'}`}
      variant="text"
    />
  )
}

NodeDefKeyLockToggle.propTypes = {
  className: PropTypes.string,
  keyFieldLocked: PropTypes.bool,
  onClick: PropTypes.func,
  testId: PropTypes.string,
}

export default NodeDefKeyLockToggle
