import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import NodeDefBoolean from './types/nodeDefBoolean'
import NodeDefCodeList from './types/nodeDefCodeList'
import NodeDefCoordinate from './types/nodeDefCoordinate'
import NodeDefEntity from './types/nodeDefEntity'
import NodeDefFile from './types/nodeDefFile'
import NodeDefTaxon from './types/nodeDefTaxon'
import NodeDefText from './types/nodeDefText'

import { nodeDefType, getNodeDefType } from '../../../../common/survey/nodeDef'
import { commandType, getNodeChildren } from '../../../../common/record/record'
import {
  getNoColumns,
  nodeDefLayoutProps,
  getPageUUID,
} from '../../../../common/survey/nodeDefLayout'

import { setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp } from '../actions'
import { updateRecord } from '../../record/actions'

import { isNodeDefRoot, isNodeDefFormLocked, getSurveyState, getRecord } from '../../surveyState'

const nodeDefTypeComponents = {
  [nodeDefType.boolean]: NodeDefBoolean,
  [nodeDefType.codeList]: NodeDefCodeList,
  [nodeDefType.coordinate]: NodeDefCoordinate,
  [nodeDefType.entity]: NodeDefEntity,
  [nodeDefType.file]: NodeDefFile,
  [nodeDefType.taxon]: NodeDefTaxon,
}

class NodeDefSwitch extends React.Component {

  constructor (props) {
    super(props)

    this.onChange = this.onChange.bind(this)
  }

  componentDidMount () {
    const {nodeDef} = this.props

    if (!nodeDef.id)
      this.refs.nodeDefElem.scrollIntoView()
  }

  isEditMode () {
    return this.props.edit
  }

  onChange (event) {
    const {nodeDef, parentNode, node, updateRecord} = this.props
    const {value} = event
    const commandValue = R.is(Object, value) ? value : {v: value}
    const command = {
      type: commandType.updateNode,
      nodeDefId: nodeDef.id,
      parentNodeId: parentNode ? parentNode.id : null,
      nodeId: node ? node.id : null,
      value: commandValue
    }
    updateRecord(command)
  }

  render () {
    const {
      nodeDef,

      // passed by the caller
      edit, draft, render,

      // actions
      setFormNodDefEdit,
      putNodeDefProp,
      setFormNodeDefUnlocked,

      //state
      locked,

      //data entry
      entry,
      parentNode,
      node,
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
        React.createElement(
          nodeDefTypeComponents[getNodeDefType(nodeDef)] || NodeDefText,
          {nodeDef, draft, edit, locked, entry, parentNode, node, render, onChange: (e) => this.onChange(e)}
        )
      }

    </div>

  }
}

NodeDefSwitch.defaultProps = {
  locked: true,
}

const determineActualNode = (state, props) => {
  const {nodeDef, entry, parentNode, node} = props
  const record = getRecord(getSurveyState(state))
  if (entry) {
    if (node) {
      return node
    } else if (parentNode) {
      const children = getNodeChildren(parentNode)(record)
      return R.find(n => n.nodeDefId === nodeDef.id)(children)
    } else {
      return null
    }
  } else {
    return null
  }
}

const mapStateToProps = (state, props) => {
  const actualNode = determineActualNode(state, props)

  return {
    locked: isNodeDefFormLocked(props.nodeDef)(state),
    node: actualNode
  }
}

export default connect(
  mapStateToProps,
  {setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp, updateRecord}
)(NodeDefSwitch)