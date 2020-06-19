import './components/dataQueryView.scss'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

import { NodeDefsSelectorView, NodeDefsSelectorAggregateView } from '@webapp/loggedin/surveyViews/nodeDefsSelector'
import Table from './components/table'

import {
  initTableData,
  updateTableNodeDefUuid,
  updateTableNodeDefUuidCols,
  updateTableMeasures,
  updateTableDimensions,
} from './actions'

import * as DataQueryState from './state'

const DataQueryView = () => {
  const dispatch = useDispatch()
  const survey = useSurvey()
  const nodeDefUuidEntity = useSelector(DataQueryState.getTableNodeDefUuidTable)
  const nodeDefUuidsAttributes = useSelector(DataQueryState.getTableNodeDefUuidCols)
  const dimensions = useSelector(DataQueryState.getTableDimensions)
  const measures = useSelector(DataQueryState.getTableMeasures)
  const nodeDefSelectorsVisible = useSelector(DataQueryState.isNodeDefSelectorsVisible)
  const modeAggregate = useSelector(DataQueryState.isTableModeAggregate)
  const hierarchy = Survey.getHierarchy(NodeDef.isEntityOrMultiple, true)(survey)

  const onChangeEntity = (...args) => dispatch(updateTableNodeDefUuid(...args))

  useEffect(() => {
    dispatch(initTableData())
  }, [])

  return (
    <div className={`data-query${nodeDefSelectorsVisible ? '' : ' node-def-selectors-off'}`}>
      {nodeDefSelectorsVisible &&
        (modeAggregate ? (
          <NodeDefsSelectorAggregateView
            nodeDefUuidEntity={nodeDefUuidEntity}
            dimensions={dimensions}
            measures={measures}
            onChangeEntity={onChangeEntity}
            onChangeMeasures={(measuresUpdate) => dispatch(updateTableMeasures(measuresUpdate))}
            onChangeDimensions={(dimensionsUpdate) => dispatch(updateTableDimensions(dimensionsUpdate))}
          />
        ) : (
          <NodeDefsSelectorView
            hierarchy={hierarchy}
            nodeDefUuidEntity={nodeDefUuidEntity}
            nodeDefUuidsAttributes={nodeDefUuidsAttributes}
            onChangeEntity={onChangeEntity}
            onChangeAttributes={(...args) => dispatch(updateTableNodeDefUuidCols(...args))}
            showMultipleAttributes={false}
          />
        ))}

      <Table />
    </div>
  )
}

export default DataQueryView
