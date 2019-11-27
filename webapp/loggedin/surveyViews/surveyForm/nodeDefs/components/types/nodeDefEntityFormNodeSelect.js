import React from 'react'
import * as R from 'ramda'

import {useI18n} from '@webapp/commonComponents/hooks'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const NodeDefEntityFormNodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode, getNodeKeyLabelValues,
    updateNode, removeNode, onChange, canEditRecord, canAddNode
  } = props

  const i18n = useI18n()

  return (
    <div className="survey-form__node-def-entity-form-header">

      <select className="node-select"
        value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
        onChange={e => onChange(e.target.value)}
        aria-disabled={R.isEmpty(nodes)}>
        <option value="placeholder" disabled hidden={true}>{i18n.t('surveyForm.nodeDefEntityForm.select')}</option>
        {
          nodes.map(n =>
            <option key={Node.getUuid(n)}
              value={Node.getUuid(n)}>
              {getNodeKeyLabelValues(nodeDef, n)}
            </option>
          )
        }
      </select>

      {
        canEditRecord &&
        <React.Fragment>
          <button className="btn btn-s"
            style={{marginLeft: '5px'}}
            aria-disabled={!selectedNode}
            onClick={() => {
              if (window.confirm(i18n.t('surveyForm.nodeDefEntityForm.confirmDelete'))) {
                onChange(null)
                removeNode(nodeDef, selectedNode)
              }
            }}>
            <span className="icon icon-bin icon-10px icon-left"/>
            {i18n.t('common.delete')}
          </button>
          <button className="btn btn-s"
            style={{marginLeft: '50px'}}
            onClick={() => {
              const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
              updateNode(nodeDef, entity)
              onChange(Node.getUuid(entity))
            }}
            aria-disabled={!canAddNode}>
            <span className="icon icon-plus icon-10px icon-left"/>
            {i18n.t('common.add')}
          </button>
        </React.Fragment>
      }
    </div>
  )
}

export default NodeDefEntityFormNodeSelect
