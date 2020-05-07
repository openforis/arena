import './nodeDefTableCellBody.scss'

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'
import PropTypes from 'prop-types'

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
      <NodeDefMultipleEditDialog {...props} onClose={() => setShowEditDialog(false)} />,
      document.body
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

const NodeDefTableCellBody = (props) => {
  const { edit, entryDataQuery, nodeDef, nodes, parentNode, surveyCycleKey, surveyInfo } = props

  const i18n = useI18n()
  const surveyLanguage = Survey.getLanguage(i18n.lang)(surveyInfo)
  const readOnly = NodeDef.isReadOnly(nodeDef) || NodeDef.isAnalysis(nodeDef)

  const propsNodeDefComponent = {
    ...props,
    readOnly,
  }
  return (
    <NodeDefErrorBadge nodeDef={nodeDef} parentNode={parentNode} nodes={nodes} edit={edit}>
      {(NodeDef.isMultiple(nodeDef) ||
        (NodeDef.isCode(nodeDef) && NodeDefLayout.isRenderCheckbox(surveyCycleKey)(nodeDef))) &&
      !entryDataQuery ? (
        <NodeDefMultipleTableCell {...propsNodeDefComponent} lang={surveyLanguage} />
      ) : (
        React.createElement(NodeDefUiProps.getComponent(nodeDef), propsNodeDefComponent)
      )}
    </NodeDefErrorBadge>
  )
}

NodeDefTableCellBody.propTypes = {
  canEditRecord: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  entryDataQuery: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
  parentNode: PropTypes.object.isRequired,
  renderType: PropTypes.string.isRequired,
  surveyCycleKey: PropTypes.string.isRequired,
  surveyInfo: PropTypes.object.isRequired,
  // TODO do not pass them to nested components
  removeNode: PropTypes.func.isRequired,
  createNodePlaceholder: PropTypes.func.isRequired,
  updateNode: PropTypes.func.isRequired,
}

NodeDefTableCellBody.defaultProps = {
  entryDataQuery: false, // True when node is being edited in data query
}

export default NodeDefTableCellBody
