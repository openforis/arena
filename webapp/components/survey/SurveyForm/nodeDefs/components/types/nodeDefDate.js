import React, { useCallback } from 'react'

import PropTypes from 'prop-types'

import * as Node from '@core/record/node'

import { DateInput } from '@webapp/components/form/DateTimeInput'
import * as DateUtils from '@core/dateUtils'

const dateFormat = {
  display: DateUtils.formats.dateDefault,
  storage: DateUtils.formats.dateISO,
}

const NodeDefDate = (props) => {
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

NodeDefDate.propTypes = {
  canEditRecord: PropTypes.bool,
  edit: PropTypes.bool,
  entry: PropTypes.bool,
  nodeDef: PropTypes.any.isRequired,
  nodes: PropTypes.array,
  readOnly: PropTypes.bool,
  updateNode: PropTypes.func.isRequired,
}

export default NodeDefDate
