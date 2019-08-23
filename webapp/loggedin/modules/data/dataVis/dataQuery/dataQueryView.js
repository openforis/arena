import './components/dataQueryView.scss'

import React from 'react'
import { connect } from 'react-redux'

import NodeDefsSelectorView from '../../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'

import Table from './components/table'

import { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols } from './actions'
import * as DataQueryState from './dataQueryState'

class DataQueryView extends React.PureComponent {

  componentDidMount () {
    this.props.initTableData()
  }

  render () {
    const {
      nodeDefUuidEntity, nodeDefUuidsAttributes, nodeDefSelectorsVisible,
      updateTableNodeDefUuid, updateTableNodeDefUuidCols
    } = this.props

    return (
      <div className={`data-query${nodeDefSelectorsVisible ? '' : ' node-def-selectors-off'}`}>

        {
          nodeDefSelectorsVisible &&
          <NodeDefsSelectorView
            nodeDefUuidEntity={nodeDefUuidEntity}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onChangeEntity={updateTableNodeDefUuid}
            onChangeAttributes={updateTableNodeDefUuidCols}
            showMultipleAttributes={false}
          />
        }

        <Table/>

      </div>
    )
  }

}

DataQueryView.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
}

const mapStateToProps = state => ({
  nodeDefUuidEntity: DataQueryState.getTableNodeDefUuidTable(state),
  nodeDefUuidsAttributes: DataQueryState.getTableNodeDefUuidCols(state),
  nodeDefSelectorsVisible: DataQueryState.isNodeDefSelectorsVisible(state),
})

export default connect(
  mapStateToProps,
  { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols }
)(DataQueryView)