import './nodeDefTableCellBody.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './nodeDefErrorBadge'
import NodeDefKeyLockToggle from './NodeDefKeyLockToggle'
import NodeDefMultipleTableCell from './nodeDefMultipleTableCell'

const NodeDefTableCellBody = (props) => {
  const {
    edit,
    entryDataQuery = false, // True when node is being edited in data query
    keyFieldLocked = false,
    keyFieldLockVisible = false,
    label = '',
    nodeDef,
    nodes,
    onKeyFieldBlur = undefined,
    onKeyFieldFocus = undefined,
    onKeyFieldLockToggle = undefined,
    parentNode,
    readOnly: readOnlyProp = false,
    surveyCycleKey,
  } = props

  const surveyLanguage = useSurveyPreferredLang()
  const readOnly = readOnlyProp || NodeDef.isReadOnlyOrAnalysis(nodeDef) || (entryDataQuery && NodeDef.isKey(nodeDef))

  const propsNodeDefComponent = {
    ...props,
    readOnly,
    insideTable: true,
  }

  const renderAsMultipleTableCell =
    (NodeDef.isMultiple(nodeDef) ||
      (NodeDef.isCode(nodeDef) && NodeDefLayout.isRenderCheckbox(surveyCycleKey)(nodeDef))) &&
    !entryDataQuery

  const nodeDefComponent = renderAsMultipleTableCell ? (
    <NodeDefMultipleTableCell {...propsNodeDefComponent} lang={surveyLanguage} />
  ) : (
    React.createElement(NodeDefUiProps.getComponent(nodeDef), propsNodeDefComponent)
  )

  const controlsVisible = keyFieldLockVisible

  return (
    <fieldset
      aria-label={label}
      className="survey-form__node-def-fieldset survey-form__node-def-table-cell-body"
      onFocus={onKeyFieldFocus}
      onBlur={onKeyFieldBlur}
    >
      <div className="survey-form__node-def-table-cell-body-inner">
        <div className="survey-form__node-def-table-cell-controls">
          {keyFieldLockVisible && (
            <NodeDefKeyLockToggle
              className="survey-form__node-def-table-cell-lock-btn"
              keyFieldLocked={keyFieldLocked}
              onClick={onKeyFieldLockToggle}
              testId={TestId.surveyForm.keyLockToggle(NodeDef.getName(nodeDef))}
            />
          )}
          <NodeDefErrorBadge
            key={`node-error-badge-${NodeDef.getUuid(nodeDef)}`}
            nodeDef={nodeDef}
            parentNode={parentNode}
            nodes={nodes}
            edit={edit}
            insideTable={true}
          />
        </div>
        <div className="survey-form__node-def-table-cell-content-wrapper" data-has-controls={controlsVisible}>
          {nodeDefComponent}
        </div>
      </div>
    </fieldset>
  )
}

NodeDefTableCellBody.propTypes = {
  canEditRecord: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  entryDataQuery: PropTypes.bool,
  keyFieldLocked: PropTypes.bool,
  keyFieldLockVisible: PropTypes.bool,
  label: PropTypes.string,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array.isRequired,
  onKeyFieldBlur: PropTypes.func,
  onKeyFieldFocus: PropTypes.func,
  onKeyFieldLockToggle: PropTypes.func,
  parentNode: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  renderType: PropTypes.string.isRequired,
  surveyCycleKey: PropTypes.string.isRequired,
  surveyInfo: PropTypes.object.isRequired,
  // TODO do not pass them to nested components
  removeNode: PropTypes.func.isRequired,
  createNodePlaceholder: PropTypes.func.isRequired,
  updateNode: PropTypes.func.isRequired,
}

export default NodeDefTableCellBody
