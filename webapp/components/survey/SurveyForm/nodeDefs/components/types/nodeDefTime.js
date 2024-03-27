import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as Node from '@core/record/node'

import { TimeInput } from '@webapp/components/form/DateTimeInput'

const NodeDefTime = (props) => {
  const { edit, entry, canEditRecord, nodeDef, nodes, readOnly, updateNode } = props

  const node = entry ? nodes[0] : null

  const timeStr = Node.getValue(node, null)

  const onChange = useCallback(
    (newTime) => {
      updateNode(nodeDef, node, newTime)
    },
    [node, nodeDef, updateNode]
  )

  return (
    <div className="survey-form__node-def-time">
      <TimeInput disabled={edit || !canEditRecord || readOnly} onChange={onChange} value={timeStr} />
    </div>
  )
}

NodeDefTime.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.any.isRequired,
  nodes: PropTypes.array,
  readOnly: PropTypes.bool,
  updateNode: PropTypes.func.isRequired,
}

NodeDefTime.defaultProps = {
  canEditRecord: false,
  edit: false,
  entry: false,
  readOnly: false,
  nodes: null,
}

export default NodeDefTime
