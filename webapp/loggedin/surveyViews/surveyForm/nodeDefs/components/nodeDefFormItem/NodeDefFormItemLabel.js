import React from 'react'
import PropTypes from 'prop-types'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'

const NodeDefFormItemLabel = (props) => {
  const { nodeDef, label, edit, parentNode, nodes } = props

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
      <div>
        <NodeDefIconKey nodeDef={nodeDef} />
        {label}
      </div>
    </NodeDefErrorBadge>
  )
}

NodeDefFormItemLabel.propTypes = {
  edit: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.object,
}

NodeDefFormItemLabel.defaultProps = {
  nodes: [],
  parentNode: null,
}

export default NodeDefFormItemLabel
