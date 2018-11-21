import React from 'react'
import * as R from 'ramda'
import Node from '../../../../../common/record/node'
import ReactDOM from 'react-dom'
import NodeDefMultipleEditDialog from './nodeDefMultipleEditDialog'

class NodeDefMultipleInTable extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      editDialogOpen: false
    }
  }

  toggleEditDialogOpen (open) {
    this.setState({
      editDialogOpen: open
    })
  }

  render () {
    const {editDialogOpen} = this.state

    if (editDialogOpen) {
      return ReactDOM.createPortal(
        <NodeDefMultipleEditDialog {...this.props}
                                   onClose={() => this.toggleEditDialogOpen(false)}/>,
        document.body
      )
    } else {
      const {nodes} = this.props

      const valuesSummary = R.pipe(
        R.reject(R.propEq('placeholder', true)),
        R.map(Node.getNodeValue),
        R.join(', '),
      )(nodes)

      return <div className="node-def__text-multiple-table-cell">
        <span className="values-summary">{valuesSummary}</span>
        <button className="btn-s btn-of-light-xs"
                onClick={() => this.toggleEditDialogOpen(true)}>
          <span className="icon icon-pencil2 icon-12px"/>
        </button>
      </div>
    }
  }
}

export default NodeDefMultipleInTable