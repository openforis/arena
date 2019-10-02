import './components/dataQueryView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import { useOnUpdate } from '../../../../../commonComponents/hooks'

import Table from './components/table'

import NodeDefsSelectorView from '../../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'

import { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols, resetTableData } from './actions'

import * as DataQueryState from './dataQueryState'
import * as SurveyState from '../../../../../survey/surveyState'

const DataQueryView = props => {

  const {
    nodeDefUuidEntity, nodeDefUuidsAttributes, nodeDefSelectorsVisible,
    surveyCycleKey,
    initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols, resetTableData,
  } = props

  useEffect(() => {
    initTableData()
  }, [])

  useOnUpdate(() => {
    resetTableData()
  }, [surveyCycleKey])

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

DataQueryView.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
}

const mapStateToProps = state => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  nodeDefUuidEntity: DataQueryState.getTableNodeDefUuidTable(state),
  nodeDefUuidsAttributes: DataQueryState.getTableNodeDefUuidCols(state),
  nodeDefSelectorsVisible: DataQueryState.isNodeDefSelectorsVisible(state),
})

export default connect(
  mapStateToProps,
  { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols, resetTableData }
)(DataQueryView)