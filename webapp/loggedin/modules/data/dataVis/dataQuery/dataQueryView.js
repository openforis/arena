import './components/dataQueryView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/commonComponents/hooks'
import NodeDefsSelectorView from '@webapp/loggedin/surveyViews/nodeDefsSelector/nodeDefsSelectorView'
import Table from './components/table'

import { initTableData, updateTableNodeDefUuid, updateTableNodeDefUuidCols } from './actions'

import * as DataQueryState from './state'

const DataQueryView = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const nodeDefUuidEntity = useSelector(DataQueryState.getTableNodeDefUuidTable)
  const nodeDefUuidsAttributes = useSelector(DataQueryState.getTableNodeDefUuidCols)
  const nodeDefSelectorsVisible = useSelector(DataQueryState.isNodeDefSelectorsVisible)
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple, true)(survey)

  useEffect(() => {
    dispatch(initTableData())
  }, [])

  return (
    <div className={`data-query${nodeDefSelectorsVisible ? '' : ' node-def-selectors-off'}`}>
      {nodeDefSelectorsVisible && (
        <NodeDefsSelectorView
          hierarchy={hierarchy}
          nodeDefUuidEntity={nodeDefUuidEntity}
          nodeDefUuidsAttributes={nodeDefUuidsAttributes}
          onChangeEntity={(...args) => dispatch(updateTableNodeDefUuid(...args))}
          onChangeAttributes={(...args) => dispatch(updateTableNodeDefUuidCols(...args))}
          showMultipleAttributes={false}
        />
      )}

      <Table />
    </div>
  )
}

export default DataQueryView
