import './dataQueryView.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefsSelector from '../../../surveyVis/nodeDefsSelector/nodeDefsSelector'
import DataTable from './dataTable'

import { initDataTable } from '../actions'

class DataQueryView extends React.PureComponent {

  constructor (props) {
    super(props)

    this.state = {
      nodeDefUuid: null,
      nodeDefAttributeUuids: [],
    }
  }

  render () {
    const { initDataTable } = this.props

    const { nodeDefUuid, nodeDefAttributeUuids } = this.state

    return (
      <div className="data-query">

        <div className="data-query__node-defs-selector">

          <NodeDefsSelector
            onChangeEntity={
              nodeDefUuid => this.setState({ nodeDefUuid })
            }
            onChangeAttributes={
              nodeDefAttributeUuids => this.setState({ nodeDefAttributeUuids })
            }/>

          <button className="btn btn-of-light btn-sync"
                  onClick={() => initDataTable(nodeDefUuid, nodeDefAttributeUuids)}
                  aria-disabled={R.isEmpty(nodeDefAttributeUuids)}>
            View
            <span className="icon icon-loop icon-16px icon-right"/>
          </button>

        </div>

        <DataTable/>

      </div>
    )
  }

}

export default connect(null, { initDataTable })(DataQueryView)