import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import NodeDefErrorBadge from '../nodeDefErrorBadge'
import NodeDefIconKey from '../NodeDefIconKey'

const NodeDefFormItemLabel = (props) => {
  const { nodeDef, label, lang, edit, parentNode, nodes } = props

  const description = NodeDef.getDescription(lang)(nodeDef)

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} edit={edit} parentNode={parentNode} nodes={nodes}>
      <div>
        <NodeDefIconKey nodeDef={nodeDef} />
        {label}
        {description ? <span className="icon icon-info icon-12px" title={description} /> : null}
      </div>
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

NodeDefFormItemLabel.defaultProps = {
  nodes: [],
  parentNode: null,
}

export default NodeDefFormItemLabel
