import React from 'react'
import { connect } from 'react-redux'

import Layout from '../../../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../../../common/survey/nodeDef'

import { setFormNodeDefEdit, setFormNodeDefAddChildTo } from '../../actions'
import { putNodeDefProp, removeNodeDef } from '../../../../../survey/nodeDefs/actions'

const NodeDefEditFormActions = (props) => {

  const {
    nodeDef,
    edit, canEditDef,
    putNodeDefProp, setFormNodeDefEdit, setFormNodeDefAddChildTo, removeNodeDef
  } = props

  const isRoot = NodeDef.isRoot(nodeDef)
  const isPage = !!Layout.getPageUuid(nodeDef)

  return edit && canEditDef && (
    <div className="node-def__form-actions">
      {
        isPage &&
        <div className="btn-of-light-xs node-def__form-root-actions">
          columns
          <input value={Layout.getNoColumns(nodeDef)}
                 type="number" min="1" max="6"
                 onChange={e => e.target.value > 0 ?
                   putNodeDefProp(nodeDef, Layout.nodeDefLayoutProps.columns, e.target.value)
                   : null
                 }/>
        </div>
      }

      <button className="btn-s btn-of-light-xs"
              onClick={() => setFormNodeDefEdit(nodeDef)}>
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
                      window.confirm('Are you sure you want to permanently delete this node definition? This operation cannot be undone')
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
  setFormNodeDefEdit,
  setFormNodeDefAddChildTo,
  putNodeDefProp,
  removeNodeDef
})(NodeDefEditFormActions)