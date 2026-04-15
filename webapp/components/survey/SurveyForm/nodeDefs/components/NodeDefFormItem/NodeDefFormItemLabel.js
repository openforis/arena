import React from 'react'
import PropTypes from 'prop-types'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'
import NodeDefKeyLockToggle from '../NodeDefKeyLockToggle/NodeDefKeyLockToggle'

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
        <NodeDefKeyLockToggle
          className="survey-form__node-def-key-lock-btn"
          keyFieldLocked={keyFieldLocked}
          onClick={onKeyFieldLockToggle}
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
