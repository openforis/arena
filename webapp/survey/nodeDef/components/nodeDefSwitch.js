import React from 'react'
import { connect } from 'react-redux'

import {
  getNoColumns,
  nodeDefLayoutProps,
  getPageUUID,
} from '../../../../common/survey/nodeDefLayout'

import { getNodeChildrenByDefId } from '../../../../common/record/record'

import { isNodeDefRoot, isNodeDefFormLocked } from '../../surveyState'
import { getRecord } from '../../record/recordState'

import { setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp } from '../actions'
import { updateNodeValue, addNode, removeNode } from '../../record/actions'

import { getNodeDefComponent } from './nodeDefSystemProps'

class NodeDefSwitch extends React.Component {

  componentDidMount () {
    const {nodeDef} = this.props

    if (!nodeDef.id)
      this.refs.nodeDefElem.scrollIntoView()
  }

  render () {
    const {
      nodeDef,

      // passed by the caller
      edit,

      // actions
      setFormNodDefEdit,
      putNodeDefProp,
      setFormNodeDefUnlocked,

      //state
      locked,
    } = this.props

    const isRoot = isNodeDefRoot(nodeDef)
    const invalid = nodeDef.validation && !nodeDef.validation.valid
    const isPage = !!getPageUUID(nodeDef)

    return <div className={`node-def__form${isPage ? ' node-def__form_page' : ''}`} ref="nodeDefElem">
      {
        invalid ?
          <div className="node-def__form-error">
            <span className="icon icon-warning icon-16px icon-left"/>
            <span>INVALID</span>
          </div>
          : null
      }

      {
        edit ?
          <div className="node-def__form-actions">
            {
              locked ?
                null :
                <React.Fragment>
                  {
                    isPage ?
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

                </React.Fragment>
            }

            <button className="btn-s btn-of-light-xs"
                    onClick={() => setFormNodeDefUnlocked(locked ? nodeDef : null)}>
              <span className={`icon icon-${locked ? 'lock' : 'unlocked'} icon-12px`}/>
            </button>

          </div>
          : null
      }

      {
        React.createElement(getNodeDefComponent(nodeDef), {...this.props})
      }

    </div>

  }
}

NodeDefSwitch.defaultProps = {
  locked: true,
}

const mapStateToProps = (state, props) => {
  const {nodeDef, parentNode, entry} = props
  return {
    locked: isNodeDefFormLocked(nodeDef)(state),
    nodes: entry ? getNodeChildrenByDefId(parentNode, nodeDef.id)(getRecord(state)) : [],
  }
}

export default connect(
  mapStateToProps,
  {
    setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp,
    updateNodeValue, addNode, removeNode,
  }
)(NodeDefSwitch)