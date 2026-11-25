import './NodeDefTableCellBody.scss'

import React from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './NodeDefErrorBadge'
import NodeDefAttributeLockToggle from './NodeDefAttributeLockToggle'
import NodeDefMultipleTableCell from './NodeDefMultipleTableCell'
import type { ArenaRecordNode } from '@openforis/arena-core'
import type { NodeDefComponentProps, NodeDefFieldLockProps } from './nodeDefComponentProps'

type NodeDefTableCellBodyProps = NodeDefComponentProps &
  NodeDefFieldLockProps & {
    // other props are passed through to the node def component
    [key: string]: any
    canEditRecord: boolean
    edit: boolean
    entry: boolean
    label?: string
    nodes: ArenaRecordNode[]
    parentNode: ArenaRecordNode
    renderType: string
    surveyCycleKey: string
    surveyInfo: Record<string, any>
    removeNode: (...args: any[]) => any
    createNodePlaceholder: (...args: any[]) => any
  }

const NodeDefTableCellBody = (props: NodeDefTableCellBodyProps) => {
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
    onQualifierFieldBlur = undefined,
    onQualifierFieldFocus = undefined,
    onQualifierFieldLockToggle = undefined,
    parentNode,
    qualifierFieldLocked = false,
    qualifierFieldLockVisible = false,
    readOnly: readOnlyProp = false,
    surveyCycleKey,
  } = props

  const onFieldFocus = (event) => {
    onKeyFieldFocus?.(event)
    onQualifierFieldFocus?.(event)
  }
  const onFieldBlur = (event) => {
    onKeyFieldBlur?.(event)
    onQualifierFieldBlur?.(event)
  }

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

  const controlsVisible = keyFieldLockVisible || qualifierFieldLockVisible

  return (
    <fieldset
      aria-label={label}
      className="survey-form__node-def-fieldset survey-form__node-def-table-cell-body"
      onFocus={onFieldFocus}
      onBlur={onFieldBlur}
    >
      <div className="survey-form__node-def-table-cell-body-inner">
        <div className="survey-form__node-def-table-cell-controls">
          {keyFieldLockVisible && (
            <NodeDefAttributeLockToggle
              className="survey-form__node-def-table-cell-lock-btn"
              locked={keyFieldLocked}
              onClick={onKeyFieldLockToggle}
              testId={TestId.surveyForm.keyLockToggle(NodeDef.getName(nodeDef))}
            />
          )}
          {qualifierFieldLockVisible && (
            <NodeDefAttributeLockToggle
              className="survey-form__node-def-table-cell-lock-btn"
              locked={qualifierFieldLocked}
              onClick={onQualifierFieldLockToggle}
              testId={TestId.surveyForm.qualifierLockToggle(NodeDef.getName(nodeDef))}
              titleKeyPrefix="recordView.qualifierAttributeEditing"
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

export default NodeDefTableCellBody
