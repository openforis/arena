import React from 'react'
import { connect } from 'react-redux'

import NodeDefText from './nodeDefText'
import EntityDef from './nodeDefEntity'

import { nodeDefType, getNodeDefType } from '../../../../common/survey/nodeDef'
import {
  getNoColumns,
  nodeDefLayoutProps,
} from '../../../../common/survey/nodeDefLayout'

import { isNodeDefRoot } from '../../surveyState'

import { setFormNodDefEdit, putNodeDefProp } from '../actions'

const nodeDefTypeComponents = {
  [nodeDefType.entity]: EntityDef,
}

class NodeDefSwitch extends React.Component {
  componentDidMount () {
    const {nodeDef} = this.props

    if (!nodeDef.id)
      this.refs.nodeDefElem.scrollIntoView()
  }

  render () {
    const {nodeDef, draft, edit, render, setFormNodDefEdit, putNodeDefProp} = this.props

    const isRoot = isNodeDefRoot(nodeDef)
    return <div className={`node-def__form${isRoot ? ' node-def__form_root' : ''}`} ref="nodeDefElem">

      {
        edit ?
          <div className="node-def__form-actions">
            {
              isRoot ?
                <div className="btn-of-light-xs node-def__form-root-actions">
                  columns
                  <input value={getNoColumns(nodeDef)}
                         type="number" min="1" max="6"
                         onChange={e => e.target.value > 0 ?
                           putNodeDefProp(nodeDef, nodeDefLayoutProps.columns, e.target.value)
                           : null
                         }/>
                </div>
                : null
            }
            <button className="btn-s btn-of-light-xs"
                    onClick={() => setFormNodDefEdit(nodeDef)}>
              <span className="icon icon-pencil2 icon-12px"/>
            </button>
            {
              isRoot ?
                null
                : <button className="btn-s btn-of-light-xs"
                          onClick={() => window.confirm('Are you sure you want to delete it?') ? null : null}>
                  <span className="icon icon-bin2 icon-12px"/>
                </button>
            }
          </div>
          : null
      }

      {
        React.createElement(
          nodeDefTypeComponents[getNodeDefType(nodeDef)] || NodeDefText,
          {nodeDef, draft, edit, render}
        )
      }

    </div>

  }
}

export default connect(null, {setFormNodDefEdit, putNodeDefProp})(NodeDefSwitch)