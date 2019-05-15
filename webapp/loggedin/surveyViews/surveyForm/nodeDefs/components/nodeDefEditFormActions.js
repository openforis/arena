import React, { useContext } from 'react'
import { connect } from 'react-redux'

import AppContext from '../../../../../app/appContext'

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

  const { i18n } = useContext(AppContext)

  const isRoot = NodeDef.isRoot(nodeDef)
  const isPage = !!Layout.getPageUuid(nodeDef)

  return edit && canEditDef && (
    <div className="node-def__form-actions">
      {
        isPage &&
        <div className="btn-of-light-xs node-def__form-root-actions">
          {i18n.t('surveyForm.nodeDefEditFormActions.columns')}
          <input value={Layout.getNoColumns(nodeDef)}
                 type="number" min="1" max="6"
                 onChange={e => e.target.value > 0 ?
                   putNodeDefProp(nodeDef, Layout.nodeDefLayoutProps.columns, e.target.value)
                   : null
                 }/>
        </div>
      }

      <button className="btn-s btn-of-light-xs"
              onClick={() => setNodeDefForEdit(nodeDef)}>
        <span className="icon icon-pencil2 icon-12px"/>
      </button>

      {
        NodeDef.isEntity(nodeDef) &&
        <button className="btn-s btn-of-light-xs"
                onClick={() => setFormNodeDefAddChildTo(nodeDef)}>
          <span className="icon icon-plus icon-12px"/>
        </button>
      }

      {
        isRoot ?
          null
          : <button className="btn-s btn-of-light-xs"
                    aria-disabled={NodeDef.isPublished(nodeDef)}
                    onClick={() => {
                      window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))
                        ? removeNodeDef(nodeDef)
                        : null
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