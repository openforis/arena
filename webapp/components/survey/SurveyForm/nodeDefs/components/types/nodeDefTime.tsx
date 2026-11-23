import { useCallback } from 'react'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'

import { TimeInput } from '@webapp/components/form/DateTimeInput'

type NodeDefTimeProps = {
  canEditRecord?: boolean
  edit?: boolean
  entry?: boolean
  nodeDef: any
  nodes?: any[]
  readOnly?: boolean
  updateNode: (...args: any[]) => any
}

const NodeDefTime = (props: NodeDefTimeProps) => {
  const {
    canEditRecord = false,
    edit = false,
    entry = false,
    readOnly = false,
    nodeDef,
    nodes = null,
    updateNode,
  } = props

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
      <TimeInput
        disabled={edit || !canEditRecord || readOnly}
        onChange={onChange}
        value={timeStr}
        withSeconds={NodeDef.isSecondsIncluded(nodeDef)}
      />
    </div>
  )
}

export default NodeDefTime
