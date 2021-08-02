import './nodeDefTableCellBody.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurveyPreferredLang } from '@webapp/store/survey'

/* eslint-disable import/no-cycle */
import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './nodeDefErrorBadge'
import NodeDefMultipleTableCell from './nodeDefMultipleTableCell'

const NodeDefTableCellBody = (props) => {
  const { edit, entryDataQuery, nodeDef, nodes, parentNode, surveyCycleKey } = props

  const surveyLanguage = useSurveyPreferredLang()
  const readOnly = NodeDef.isReadOnlyOrAnalysis(nodeDef)

  const propsNodeDefComponent = {
    ...props,
    readOnly,
  }
  return (
    <NodeDefErrorBadge nodeDef={nodeDef} parentNode={parentNode} nodes={nodes} edit={edit}>
      {(NodeDef.isMultiple(nodeDef) ||
        (NodeDef.isCode(nodeDef) && NodeDefLayout.isRenderCheckbox(surveyCycleKey)(nodeDef))) &&
      !entryDataQuery ? (
        /* eslint-disable react/jsx-props-no-spreading */
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
