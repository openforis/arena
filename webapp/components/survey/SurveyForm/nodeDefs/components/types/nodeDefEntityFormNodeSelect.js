import React from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useI18n } from '@webapp/store/system'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

const NodeDefEntityFormNodeSelect = (props) => {
  const {
    nodeDef,
    nodes,
    parentNode,
    selectedNode,
    updateNode,
    removeNode,
    onChange,
    canEditRecord,
    canAddNode,
  } = props

  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div className="survey-form__node-def-entity-form-header">
      <select
        className="node-select"
        value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
        onChange={(e) => onChange(e.target.value)}
        aria-disabled={R.isEmpty(nodes)}
      >
        <option value="placeholder" disabled hidden={true}>
          {i18n.t('surveyForm.nodeDefEntityForm.select')}
        </option>
        {nodes.map((n) => (
          <option key={Node.getUuid(n)} value={Node.getUuid(n)}>
            {dispatch(SurveyFormActions.getNodeKeyLabelValues(nodeDef, n))}
          </option>
        ))}
      </select>

      {canEditRecord && (
        <React.Fragment>
          <button
            className="btn btn-s"
            style={{ marginLeft: '5px' }}
            aria-disabled={!selectedNode}
            onClick={() => {
              dispatch(
                DialogConfirmActions.showDialogConfirm({
                  key: 'surveyForm.nodeDefEntityForm.confirmDelete',
                  onOk: () => {
                    onChange(null)
                    removeNode(nodeDef, selectedNode)
                  },
                })
              )
            }}
          >
            <span className="icon icon-bin icon-10px icon-left" />
            {i18n.t('common.delete')}
          </button>
          <button
            className="btn btn-s"
            style={{ marginLeft: '50px' }}
            onClick={() => {
              const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
              updateNode(nodeDef, entity)
              onChange(Node.getUuid(entity))
            }}
            aria-disabled={!canAddNode}
          >
            <span className="icon icon-plus icon-10px icon-left" />
            {i18n.t('common.add')}
          </button>
        </React.Fragment>
      )}
    </div>
  )
}

export default NodeDefEntityFormNodeSelect
