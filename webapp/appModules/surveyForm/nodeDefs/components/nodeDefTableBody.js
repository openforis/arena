import React from 'react'
import ReactDOM from 'react-dom'
import * as R from 'ramda'

import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'

import NodeDef from '../../../../../common/survey/nodeDef'
import Node from '../../../../../common/record/node'

import { getNodeDefComponent } from '../nodeDefSystemProps'

const getNodeValues =
  R.pipe(
    R.reject(R.propEq('placeholder', true)),
    R.map(node => Node.getNodeValue(node)),
    R.map(nodeValue => nodeValue.fileName ? nodeValue.fileName : nodeValue),
    R.join(', '),
  )

class NodeDefMultipleTableBody extends React.Component {

  constructor (props) {
    super(props)

    this.state = {editDialogOpen: false}
  }

  toggleEditDialogOpen (open) {
    this.setState({editDialogOpen: open})
  }

  render () {
    return this.state.editDialogOpen
      ? (
        ReactDOM.createPortal(
          <NodeDefMultipleEditDialog {...this.props}
                                     onClose={() => this.toggleEditDialogOpen(false)}/>,
          document.body
        )
      )
      : (
        <div className="node-def__text-multiple-table-cell">
          <span className="values-summary">{getNodeValues(this.props.nodes)}</span>
          <button className="btn-s btn-of-light-xs"
                  onClick={() => this.toggleEditDialogOpen(true)}>
            <span className="icon icon-pencil2 icon-12px"/>
          </button>
        </div>
      )

  }

}

const NodeDefTableBody = props => {
  const {nodeDef} = props

  return (
    NodeDef.isNodeDefMultiple(nodeDef) || NodeDef.isNodeDefCodeList(nodeDef)
      ? <NodeDefMultipleTableBody {...props}/>
      : React.createElement(getNodeDefComponent(nodeDef), {...props})
  )
}

export default NodeDefTableBody