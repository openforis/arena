import './NodeDefAttributeLockToggle.scss'

import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

const NodeDefAttributeLockToggle = (props) => {
  const {
    className = '',
    locked = false,
    onClick = undefined,
    testId = undefined,
    titleKeyPrefix = 'recordView.keyAttributeEditing',
  } = props

  const classNameButton = classNames('survey-form__node-def-attribute-lock-toggle', className)

  return (
    <Button
      className={classNameButton}
      closeTooltipOnClick
      iconClassName={locked ? 'icon-lock icon-12px' : 'icon-unlocked icon-12px'}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      showLabel={false}
      size="small"
      testId={testId}
      title={`${titleKeyPrefix}.${locked ? 'unlock' : 'lock'}`}
      variant="text"
    />
  )
}

NodeDefAttributeLockToggle.propTypes = {
  className: PropTypes.string,
  locked: PropTypes.bool,
  onClick: PropTypes.func,
  testId: PropTypes.string,
  titleKeyPrefix: PropTypes.string,
}

export default NodeDefAttributeLockToggle
