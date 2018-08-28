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
import {
  getNoColumns,
  nodeDefLayoutProps,
  getPageUUID,
} from '../../../../common/survey/nodeDefLayout'
import { getNodesByDefId, getNodeChildren } from '../../../../common/record/record'

import { setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp } from '../actions'
import { updateRecord } from '../../record/actions'

import { isNodeDefRoot, isNodeDefFormLocked, getSurveyState } from '../../surveyState'
import { getRecord } from '../../record/recordState'

const nodeDefTypeComponents = {
  [nodeDefType.entity]: NodeDefEntity,
  [nodeDefType.boolean]: NodeDefBoolean,
  [nodeDefType.codeList]: NodeDefCodeList,
  [nodeDefType.coordinate]: NodeDefCoordinate,
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
    console.log('=== on change ', this.props.nodeDef)
    // const {nodeDef, parentNode, node, updateRecord} = this.props
    // const {value} = event
    // const commandValue = R.is(Object, value) ? value : {v: value}
    // const command = {
    //   type: commandType.updateNode,
    //   nodeDefId: nodeDef.id,
    //   parentNodeId: parentNode ? parentNode.id : null,
    //   nodeId: node ? node.id : null,
    //   value: commandValue
    // }
    // updateRecord(command)
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
        React.createElement(
          nodeDefTypeComponents[getNodeDefType(nodeDef)] || NodeDefText,
          {
            ...this.props,
            onChange: (e) => this.onChange(e)
          }
        )
      }

    </div>

  }
}

NodeDefSwitch.defaultProps = {
  locked: true,
}

const mapStateToProps = (state, props) => ({
  locked: isNodeDefFormLocked(props.nodeDef)(state),
  nodes: props.entry ? getNodesByDefId(props.nodeDef.id)(getRecord(state)) : [],
})

export default connect(
  mapStateToProps,
  {setFormNodDefEdit, setFormNodeDefUnlocked, putNodeDefProp, updateRecord}
)(NodeDefSwitch)