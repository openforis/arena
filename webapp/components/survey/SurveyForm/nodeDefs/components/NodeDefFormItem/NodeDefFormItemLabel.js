import React from 'react'
import PropTypes from 'prop-types'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'
import { NodeDefInfoIcon } from '../NodeDefInfoIcon'

const NodeDefFormItemLabel = (props) => {
  const { nodeDef, label, lang, edit, nodes = [], parentNode = null } = props

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
      <NodeDefIconKey nodeDef={nodeDef} />
      <span>{label}</span>
      <NodeDefInfoIcon lang={lang} nodeDef={nodeDef} />
    </NodeDefErrorBadge>
  )
}

NodeDefFormItemLabel.propTypes = {
  edit: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.object,
}

export default NodeDefFormItemLabel
