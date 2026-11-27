import './NodeDefAttributeLockToggle.scss'

import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'

type NodeDefAttributeLockToggleProps = {
  className?: string
  locked?: boolean
  onClick?: (...args: any[]) => any
  testId?: string
  titleKeyPrefix?: string
}

const NodeDefAttributeLockToggle = (props: NodeDefAttributeLockToggleProps) => {
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
      iconName={locked ? 'lock' : 'lockOpen'}
      iconSize={14}
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

export default NodeDefAttributeLockToggle
