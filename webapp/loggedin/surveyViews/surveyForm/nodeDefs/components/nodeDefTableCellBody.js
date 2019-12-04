import './nodeDefTableCellBody.scss'

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'
import NodeDefErrorBadge from './nodeDefErrorBadge'

const getNodeValues = (surveyInfo, nodeDef, nodes, lang) => {
  const getNodeValue = node => {
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
    nodes,
  )
}

const NodeDefMultipleTableCell = props => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [nodeValues, setNodeValues] = useState([])

  const { surveyInfo, nodeDef, nodes, lang, canEditRecord } = props

  useEffect(() => {
    const nodeValuesUpdate = getNodeValues(surveyInfo, nodeDef, nodes, lang)
    setNodeValues(nodeValuesUpdate)
  }, [nodes])

  return showEditDialog ? (
    ReactDOM.createPortal(
      <NodeDefMultipleEditDialog {...props} onClose={() => setShowEditDialog(false)} />,
      document.body,
    )
  ) : (
    <div className="survey-form__node-def-table-cell-body-multiple">
      <span className="values-summary">{nodeValues}</span>
      <button className="btn-s" onClick={() => setShowEditDialog(true)}>
        <span className={`icon icon-12px ${canEditRecord ? 'icon-pencil2' : 'icon-eye'}`} />
      </button>
    </div>
  )
}

const NodeDefTableCellBody = props => {
  const { surveyInfo, surveyCycleKey, nodeDef, parentNode, nodes, edit, entryDataQuery } = props
  const surveyLanguage = Survey.getLanguage(useI18n().lang)(surveyInfo)

  return (
    <NodeDefErrorBadge nodeDef={nodeDef} parentNode={parentNode} nodes={nodes} edit={edit}>
      {(NodeDef.isMultiple(nodeDef) ||
        (NodeDef.isCode(nodeDef) && NodeDefLayout.isRenderCheckbox(surveyCycleKey)(nodeDef))) &&
      !entryDataQuery ? (
        <NodeDefMultipleTableCell {...props} lang={surveyLanguage} />
      ) : (
        React.createElement(NodeDefUiProps.getComponent(nodeDef), { ...props })
      )}
    </NodeDefErrorBadge>
  )
}

NodeDefTableCellBody.defaultProps = {
  entryDataQuery: false, // True when node is being edited in data query
}

export default NodeDefTableCellBody
