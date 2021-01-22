import './nodeDefDate.scss'

import React from 'react'

import PropTypes from 'prop-types'

import * as Node from '@core/record/node'

import DateInput from '@webapp/components/form/DateInput'

const NodeDefDate = (props) => {
  const { edit, entry, canEditRecord, nodeDef, nodes, readOnly, updateNode } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, null)

  const handleChangeDateInput = (newDate) => {
    updateNode(nodeDef, node, newDate)
  }

  return (
    <div className="survey-form__node-def-date">
      <DateInput disabled={edit || !canEditRecord || readOnly} onChange={handleChangeDateInput} value={nodeValue} />
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

NodeDefDate.defaultProps = {
  canEditRecord: false,
  edit: false,
  entry: false,
  readOnly: false,
  nodes: null,
}

export default NodeDefDate
