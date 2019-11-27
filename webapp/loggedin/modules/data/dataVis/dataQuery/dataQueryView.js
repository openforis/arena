import './components/dataQueryView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyState from '@webapp/survey/surveyState'
import NodeDefsSelectorView from '../../../../surveyViews/nodeDefsSelector/nodeDefsSelectorView'
import Table from './components/table'

import {
  initTableData,
  updateTableNodeDefUuid,
  updateTableNodeDefUuidCols,
} from './actions'

import * as DataQueryState from './dataQueryState'

const DataQueryView = props => {
  const {
    hierarchy,
    nodeDefUuidEntity,
    nodeDefUuidsAttributes,
    nodeDefSelectorsVisible,
    initTableData,
    updateTableNodeDefUuid,
    updateTableNodeDefUuidCols,
  } = props

  useEffect(() => {
    initTableData()
  }, [])

  return (
    <div
      className={`data-query${
        nodeDefSelectorsVisible ? '' : ' node-def-selectors-off'
      }`}
    >
      {nodeDefSelectorsVisible && (
        <NodeDefsSelectorView
          hierarchy={hierarchy}
          nodeDefUuidEntity={nodeDefUuidEntity}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onChangeEntity={updateTableNodeDefUuid}
          onChangeAttributes={updateTableNodeDefUuidCols}
          showMultipleAttributes={false}
        />
      )}

      <Table />
    </div>
  )
}

DataQueryView.defaultProps = {
  nodeDefUuidEntity: '',
  nodeDefUuidsAttributes: [],
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)

  return {
    hierarchy,
    surveyCycleKey: SurveyState.getSurveyCycleKey(state),
    nodeDefUuidEntity: DataQueryState.getTableNodeDefUuidTable(state),
    nodeDefUuidsAttributes: DataQueryState.getTableNodeDefUuidCols(state),
    nodeDefSelectorsVisible: DataQueryState.isNodeDefSelectorsVisible(state),
  }
}

export default connect(mapStateToProps, {
  initTableData,
  updateTableNodeDefUuid,
  updateTableNodeDefUuidCols,
})(DataQueryView)
