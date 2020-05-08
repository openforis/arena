import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

/* eslint-disable import/no-cycle */
import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'

const getNodeValues = (nodeDef, nodes, lang) => {
  const getNodeValue = (node) => {
    if (NodeDef.isCode(nodeDef)) {
      const item = NodeRefData.getCategoryItem(node)
      const label = CategoryItem.getLabel(lang)(item)
      return label || CategoryItem.getCode(item)
    }

    if (NodeDef.isFile(nodeDef)) {
      return Node.getFileName(node)
    }

    return Node.getValue(node)
  }

  return R.reduce(
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
    setNodeValues(nodeValuesUpdate)
  }, [nodes])

  return showEditDialog ? (
    ReactDOM.createPortal(
      /* eslint-disable react/jsx-props-no-spreading */
      <NodeDefMultipleEditDialog {...props} onClose={() => setShowEditDialog(false)} />,
      document.body
    )
  ) : (
    <div className="survey-form__node-def-table-cell-body-multiple">
      <span className="values-summary">{nodeValues}</span>
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
