import './nodeDefEditButtons.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '../../../../../commonComponents/hooks'

import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../../common/survey/nodeDefLayout'

import { setFormNodeDefAddChildTo } from '../../actions'
import { putNodeDefProp, removeNodeDef } from '../../../../../survey/nodeDefs/actions'
import { setNodeDefForEdit } from '../../../nodeDefEdit/actions'

const NodeDefEditButtons = (props) => {

  const {
    surveyCycleKey, nodeDef,
    edit, canEditDef,
    putNodeDefProp, setNodeDefForEdit, setFormNodeDefAddChildTo, removeNodeDef
  } = props

  const i18n = useI18n()

  return edit && canEditDef && (
    <div className="survey-form__node-def-edit-buttons">

      {
        NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) &&
        <div className="survey-form__node-def-edit-page-props">
          {i18n.t('surveyForm.nodeDefEditFormActions.columns')}
          <input value={NodeDefLayout.getColumnsNo(surveyCycleKey)(nodeDef)}
                 type="number" min="1" max="12"
                 onChange={e => e.target.value > 0 ?
                   putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.columns, e.target.value)
                   : null
                 }/>
        </div>
      }

      <button className="btn btn-s btn-transparent"
              onClick={() => setNodeDefForEdit(nodeDef)}
              onMouseDown={e => {
                e.stopPropagation()
              }}>
        <span className="icon icon-pencil2 icon-12px"/>
      </button>

      {
        NodeDef.isEntity(nodeDef) &&
        <button className="btn btn-s btn-transparent"
                onClick={() => setFormNodeDefAddChildTo(nodeDef)}
                onMouseDown={e => {
                  e.stopPropagation()
                }}>
          <span className="icon icon-plus icon-12px"/>
        </button>
      }

      {
        !NodeDef.isRoot(nodeDef) &&
        <button className="btn btn-s btn-transparent"
                onClick={() => removeNodeDef(nodeDef)}
                onMouseDown={e => {
                  e.stopPropagation()
                }}>
          <span className="icon icon-bin2 icon-12px"/>
        </button>
      }

    </div>
  )

}

export default connect(null, {
  setNodeDefForEdit,
  setFormNodeDefAddChildTo,
  putNodeDefProp,
  removeNodeDef,
})(NodeDefEditButtons)