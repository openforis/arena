import './dataQuery.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { Paginator } from '@webapp/components/Table'

import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

import { RecordEditModal } from '@webapp/views/App/views/Data/common/RecordEditModal'

import { useNodeDefLabelSwitch } from '../survey/NodeDefLabelSwitch'
import { useDataQuery } from './store'
import QueryNodeDefsSelector from './QueryNodeDefsSelector'
import ButtonBar from './ButtonBar'
import LoadingBar from '../LoadingBar'
import Visualizer from './Visualizer'
import {
  DataQuerySelectedAttributes,
  DataQuerySelectedDimensions,
  DataQuerySelectedMeasures,
} from './DataQuerySortableItems'

const DataQuery = () => {
  const dispatch = useDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const query = DataExplorerSelectors.useQuery()
  const nodeDefsSelectorVisible = DataExplorerSelectors.useIsNodeDefsSelectorVisible()
  const recordEditModalProps = DataExplorerSelectors.useRecordEditModalProps()

  const {
    count,
    data,
    dataEmpty,
    dataLoaded,
    dataLoading,
    dataLoadingError,
    limit,
    offset,
    setLimit,
    setOffset,
    setData,
  } = useDataQuery({ query })

  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()

  return (
    <div className={classNames('data-query', { 'nodedefs-selector-off': !nodeDefsSelectorVisible })}>
      <QueryNodeDefsSelector nodeDefLabelType={nodeDefLabelType} />

      <div
        className={classNames('data-query__container', 'table', {
          edit: Query.isModeRawEdit(query),
          'no-content': !dataLoaded,
        })}
      >
        {dataLoading && <LoadingBar />}

        <div className="table__header">
          <ButtonBar
            dataCount={count}
            dataEmpty={dataEmpty}
            dataLoaded={dataLoaded}
            dataLoading={dataLoading}
            nodeDefLabelType={nodeDefLabelType}
            onNodeDefLabelTypeChange={toggleLabelFunction}
            setQueryLimit={setLimit}
            setQueryOffset={setOffset}
          />
        </div>

        <DataQuerySelectedAttributes nodeDefLabelType={nodeDefLabelType} />
        <DataQuerySelectedDimensions nodeDefLabelType={nodeDefLabelType} />
        <DataQuerySelectedMeasures nodeDefLabelType={nodeDefLabelType} />

        <Visualizer
          data={data}
          dataEmpty={dataEmpty}
          dataLoading={dataLoading}
          dataLoadingError={dataLoadingError}
          nodeDefLabelType={nodeDefLabelType}
          offset={offset}
          setData={setData}
        />

        {dataLoaded && displayType === DataExplorerState.displayTypes.table && count && (
          <div className="table__footer">
            <Paginator count={count} limit={limit} offset={offset} setLimit={setLimit} setOffset={setOffset} />
          </div>
        )}
      </div>

      {recordEditModalProps && (
        <RecordEditModal
          onRequestClose={() => dispatch(DataExplorerActions.closeRecordEditModal())}
          recordUuid={recordEditModalProps.recordUuid}
          parentNodeUuid={recordEditModalProps.parentNodeUuid}
        />
      )}
    </div>
  )
}

export default DataQuery
