import './nodeDefEditButtons.scss'

import React from 'react'
import { connect } from 'react-redux'

import { useI18n } from '../../../../../commonComponents/hooks'

import Layout from '../../../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../../../common/survey/nodeDef'

import { setFormNodeDefAddChildTo } from '../../actions'
import { putNodeDefProp, removeNodeDef } from '../../../../../survey/nodeDefs/actions'
import { setNodeDefForEdit } from '../../../nodeDefEdit/actions'

const NodeDefEditButtons = (props) => {

  const {
    nodeDef,
    edit, canEditDef,
    putNodeDefProp, setNodeDefForEdit, setFormNodeDefAddChildTo, removeNodeDef
  } = props

  const i18n = useI18n()

  const isRoot = NodeDef.isRoot(nodeDef)
  const isPage = !!Layout.getPageUuid(nodeDef)

  return edit && canEditDef && (
    <div className="survey-form__node-def-edit-buttons">
      {
        isPage &&
        <div className="survey-form__node-def-edit-page-props">
          {i18n.t('surveyForm.nodeDefEditFormActions.columns')}
          <input value={Layout.getNoColumns(nodeDef)}
                 type="number" min="1" max="12"
                 onChange={e => e.target.value > 0 ?
                   putNodeDefProp(nodeDef, Layout.nodeDefLayoutProps.columns, e.target.value)
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
        !(isRoot || NodeDef.isPublished(nodeDef)) &&
        <button className="btn btn-s btn-transparent"
                onClick={() => {
                  window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))
                    ? removeNodeDef(nodeDef)
                    : null
                }}
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