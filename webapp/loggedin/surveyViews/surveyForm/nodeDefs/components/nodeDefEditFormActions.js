import React from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../../commonComponents/useI18n'

import Layout from '../../../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../../../common/survey/nodeDef'

import { setFormNodeDefAddChildTo } from '../../actions'
import { putNodeDefProp, removeNodeDef } from '../../../../../survey/nodeDefs/actions'
import { setNodeDefForEdit } from '../../../nodeDefEdit/actions'

const NodeDefEditFormActions = (props) => {

  const {
    nodeDef,
    edit, canEditDef,
    putNodeDefProp, setNodeDefForEdit, setFormNodeDefAddChildTo, removeNodeDef
  } = props

  const i18n = useI18n()

  const isRoot = NodeDef.isRoot(nodeDef)
  const isPage = !!Layout.getPageUuid(nodeDef)

  return edit && canEditDef && (
    <div className="node-def__form-actions">
      {
        isPage &&
        <div className="node-def__form-root-actions">
          {i18n.t('surveyForm.nodeDefEditFormActions.columns')}
          <input value={Layout.getNoColumns(nodeDef)}
                 type="number" min="1" max="12"
                 onChange={e => e.target.value > 0 ?
                   putNodeDefProp(nodeDef, Layout.nodeDefLayoutProps.columns, e.target.value)
                   : null
                 }/>
        </div>
      }

      <button className="btn-s"
              onClick={() => setNodeDefForEdit(nodeDef)}
              onMouseDown={e => {
                e.stopPropagation()
              }}>
        <span className="icon icon-pencil2 icon-12px"/>
      </button>

      {
        NodeDef.isEntity(nodeDef) &&
        <button className="btn btn-s"
                onClick={() => setFormNodeDefAddChildTo(nodeDef)}
                onMouseDown={e => {
                  e.stopPropagation()
                }}>
          <span className="icon icon-plus icon-12px"/>
        </button>
      }

      {
        !(isRoot || NodeDef.isPublished(nodeDef)) &&
        <button className="btn btn-s"
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
})(NodeDefEditFormActions)