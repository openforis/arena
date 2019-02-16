import './dataQueryView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefsSelectorView from '../../../surveyVis/nodeDefsSelector/nodeDefsSelectorView'

import DataTable from './dataTable'
import * as DataVisState from '../dataVisState'

import { initDataTable } from '../actions'

class DataQueryView extends React.PureComponent {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuidEntity: props.nodeDefUuidEntity,
      nodeDefAttributeUuids: props.nodeDefUuidsAttributes,
    }
  }

  render () {
    const { initDataTable } = this.props

    const { nodeDefUuidEntity, nodeDefUuidsAttributes } = this.state

    return (
      <div className="data-query">

        <div className="data-query__node-defs-selector">

          <NodeDefsSelectorView
            nodeDefUuidEntity={nodeDefUuidEntity}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onChangeEntity={
              nodeDefUuidEntity => this.setState({ nodeDefUuidEntity })
            }
            onChangeAttributes={
              nodeDefUuidsAttributes => this.setState({ nodeDefUuidsAttributes })
            }/>

          <button className="btn btn-of-light btn-sync"
                  onClick={() => initDataTable(nodeDefUuidEntity, nodeDefUuidsAttributes)}
                  aria-disabled={R.isEmpty(nodeDefUuidsAttributes)}>
            View
            <span className="icon icon-loop icon-16px icon-right"/>
          </button>

        </div>

        <DataTable/>

      </div>
    )
  }

}

DataQueryView.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
}

const mapStateToProps = state => ({
  nodeDefUuidEntity: DataVisState.getTableNodeDefUuidTable(state),
  nodeDefUuidsAttributes: DataVisState.getTableNodeDefUuidCols(state)
})

export default connect(mapStateToProps, { initDataTable })(DataQueryView)