import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as A from '@core/arena'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'

const getNodeValues = (nodeDef, nodes, lang) => {
  const getNodeValue = (node) => {
    if (NodeDef.isCode(nodeDef)) {
      const item = NodeRefData.getCategoryItem(node)
      return CategoryItem.getLabel(lang)(item)
    }

    if (NodeDef.isFile(nodeDef)) {
      return Node.getFileName(node)
    }

    return Node.getValue(node)
  }

  return A.reduce(
    (accString, node) =>
      Node.isPlaceholder(node) || Node.isValueBlank(node)
        ? accString
        : `${accString === '' ? '' : `${accString}, `}${getNodeValue(node)}`,
    '',
    nodes
  )
}

const NodeDefMultipleTableCell = (props) => {
  const { nodeDef, nodes, lang, canEditRecord } = props

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [nodeValues, setNodeValues] = useState([])

  useEffect(() => {
    const nodeValuesUpdate = getNodeValues(nodeDef, nodes, lang)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the derived values in sync with the nodes prop
    setNodeValues(nodeValuesUpdate)
  }, [nodes])

  if (showEditDialog) {
    return ReactDOM.createPortal(
      <NodeDefMultipleEditDialog {...props} onClose={() => setShowEditDialog(false)} />,
      document.body
    )
  }
  return (
    <div className="survey-form__node-def-table-cell-body-multiple">
      <span className="values-summary">
        <LabelWithTooltip label={nodeValues} />
      </span>
      <button type="button" className="btn-s" onClick={() => setShowEditDialog(true)}>
        <span className={`icon icon-12px ${canEditRecord ? 'icon-pencil2' : 'icon-eye'}`} />
      </button>
    </div>
  )
}

NodeDefMultipleTableCell.propTypes = {
  canEditRecord: PropTypes.bool.isRequired,
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
}

export default NodeDefMultipleTableCell
