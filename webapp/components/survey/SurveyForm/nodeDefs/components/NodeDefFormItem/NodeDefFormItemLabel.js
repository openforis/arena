import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'

const NodeDefFormItemLabel = (props) => {
  const {
    nodeDef,
    label,
    lang,
    edit,
    keyFieldLocked = false,
    keyFieldLockVisible = false,
    nodes = [],
    onKeyFieldLockToggle = undefined,
    parentNode = null,
  } = props

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
      <NodeDefIconKey nodeDef={nodeDef} />
      <span>{label}</span>
      {keyFieldLockVisible && (
        <Button
          className="survey-form__node-def-key-lock-btn"
          iconClassName={keyFieldLocked ? 'icon-lock icon-12px' : 'icon-unlocked icon-12px'}
          label={`recordView.${keyFieldLocked ? 'unlock' : 'lock'}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onKeyFieldLockToggle}
          showLabel={false}
          size="small"
          variant="text"
        />
      )}
      <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
    </NodeDefErrorBadge>
  )
}

NodeDefFormItemLabel.propTypes = {
  edit: PropTypes.bool.isRequired,
  keyFieldLocked: PropTypes.bool,
  keyFieldLockVisible: PropTypes.bool,
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  onKeyFieldLockToggle: PropTypes.func,
  parentNode: PropTypes.object,
}

export default NodeDefFormItemLabel
