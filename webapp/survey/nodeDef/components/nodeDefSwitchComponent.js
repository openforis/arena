import React from 'react'
import { connect } from 'react-redux'

import DefaultNodeDefComponent from './defaultNodeDefComponent'
import EntityDefComponent from './entityDefComponent'

import { nodeDefType, getNodeDefType } from '../../../../common/survey/nodeDef'
import { setFormNodDefEdit } from '../actions'
import { isNodeDefRoot } from '../../surveyState'

const nodeDefTypeComponents = {
  [nodeDefType.entity]: EntityDefComponent,
}

class NodeDefSwitchComponent extends React.Component {
  componentDidMount () {
    const {nodeDef} = this.props

    if (!nodeDef.id)
      this.refs.nodeDefElem.scrollIntoView()
  }

  render () {
    const {nodeDef, draft, edit, render, setFormNodDefEdit} = this.props

    const isRoot = isNodeDefRoot(nodeDef)
    return <div className={`node-def__form${isRoot ? ' node-def__form_root' : ''}`} ref="nodeDefElem">

      {
        edit ?
          <div className="node-def__form-actions">
            <button className="btn-s btn-of-light-xs"
                    onClick={() => setFormNodDefEdit(nodeDef)}>
              <span className="icon icon-pencil2 icon-12px"/>
            </button>
            {
              isRoot
                ? null
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
          nodeDefTypeComponents[getNodeDefType(nodeDef)] || DefaultNodeDefComponent,
          {nodeDef, draft, edit, render}
        )
      }

    </div>

  }
}

export default connect(null, {setFormNodDefEdit})(NodeDefSwitchComponent)