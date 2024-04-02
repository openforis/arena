import './dataQuery.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Chip from '@mui/material/Chip'

import { Query } from '@common/model/query'

import { Paginator } from '@webapp/components/Table'

import { useDataQuery } from './store'
import QueryNodeDefsSelector from './QueryNodeDefsSelector'
import ButtonBar from './ButtonBar'
import LoadingBar from '../LoadingBar'
import Visualizer from './Visualizer'
import { useNodeDefLabelSwitch } from '../survey/NodeDefLabelSwitch'
import { DataQuerySelectedAttributes } from './DataQuerySelectedAttributes'

const DataQuery = (props) => {
  const { query, onChangeQuery } = props

  const [nodeDefsSelectorVisible, setNodeDefsSelectorVisible] = useState(true)
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
      <QueryNodeDefsSelector nodeDefLabelType={nodeDefLabelType} query={query} onChangeQuery={onChangeQuery} />

      <div
        className={classNames('data-query__container', 'table', {
          edit: Query.isModeRawEdit(query),
          'no-content': !dataLoaded,
        })}
      >
        {dataLoading && <LoadingBar />}

        <div className="table__header">
          <ButtonBar
            dataEmpty={dataEmpty}
            dataLoaded={dataLoaded}
            dataLoading={dataLoading}
            query={query}
            nodeDefLabelType={nodeDefLabelType}
            nodeDefsSelectorVisible={nodeDefsSelectorVisible}
            onChangeQuery={onChangeQuery}
            onNodeDefLabelTypeChange={toggleLabelFunction}
            setNodeDefsSelectorVisible={setNodeDefsSelectorVisible}
          />
        </div>

        <DataQuerySelectedAttributes nodeDefLabelType={nodeDefLabelType} query={query} />

        <Visualizer
          query={query}
          data={data}
          dataEmpty={dataEmpty}
          dataLoading={dataLoading}
          dataLoadingError={dataLoadingError}
          nodeDefLabelType={nodeDefLabelType}
          nodeDefsSelectorVisible={nodeDefsSelectorVisible}
          offset={offset}
          onChangeQuery={onChangeQuery}
          setData={setData}
        />

        {dataLoaded && Query.getDisplayType(query) === Query.displayTypes.table && count && (
          <div className="table__footer">
            <Paginator count={count} limit={limit} offset={offset} setLimit={setLimit} setOffset={setOffset} />
          </div>
        )}
      </div>
    </div>
  )
}

DataQuery.propTypes = {
  query: PropTypes.object.isRequired,
  onChangeQuery: PropTypes.func,
}

DataQuery.defaultProps = {
  onChangeQuery: () => {},
}

export default DataQuery
