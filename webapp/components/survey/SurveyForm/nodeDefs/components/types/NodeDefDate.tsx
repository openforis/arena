import { useCallback } from 'react'

import * as Node from '@core/record/node'

import { DateInput } from '@webapp/components/form/DateTimeInput'
import * as DateUtils from '@core/dateUtils'
import type { NodeDefComponentProps } from '../nodeDefComponentProps'

const dateFormat = {
  display: DateUtils.formats.dateDefault,
  storage: DateUtils.formats.dateISO,
}

const NodeDefDate = (props: NodeDefComponentProps) => {
  const {
    canEditRecord = false,
    edit = false,
    entry = false,
    nodeDef,
    nodes = null,
    readOnly = false,
    updateNode,
  } = props

  const node = entry ? nodes[0] : null

  const dateStr = Node.getValue(node, null)
  const nodeValueFormatted = DateUtils.convertDate({ dateStr, formatTo: dateFormat.display, keepTimeZone: false })

  const handleChangeDateInput = useCallback(
    (newDate) => {
      const newDateFormatted = newDate
        ? DateUtils.convertDate({
            dateStr: newDate,
            formatFrom: dateFormat.display,
            formatTo: dateFormat.storage,
            keepTimeZone: false, // in this case we need to discard the timezone info
          })
        : null

      updateNode(nodeDef, node, newDateFormatted)
    },
    [node, nodeDef, updateNode]
  )

  return (
    <div className="survey-form__node-def-date">
      <DateInput
        disabled={edit || !canEditRecord || readOnly}
        onChange={handleChangeDateInput}
        value={nodeValueFormatted}
      />
    </div>
  )
}

export default NodeDefDate
