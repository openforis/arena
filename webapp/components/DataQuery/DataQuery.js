import './dataQuery.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Query } from '@common/model/query'

import { useDataQuery } from './store'
import QueryNodeDefsSelector from './QueryNodeDefsSelector'
import ButtonBar from './ButtonBar'
import Visualizer from './Visualizer'

const DataQuery = (props) => {
  const { query, onChangeQuery } = props

  const [nodeDefsSelectorVisible, setNodeDefsSelectorVisible] = useState(true)
  const { data, dataEmpty, dataLoaded, dataLoading, offset } = useDataQuery({ query })

  return (
    <div className={classNames('data-query', { 'nodedefs-selector-off': !nodeDefsSelectorVisible })}>
      <QueryNodeDefsSelector query={query} onChangeQuery={onChangeQuery} />

      <div
        className={classNames('data-query__container', 'table', {
          edit: Query.isModeRawEdit(query),
          'no-content': !dataLoaded,
        })}
      >
        <div className="table__header">
          <ButtonBar
            dataEmpty={dataEmpty}
            dataLoaded={dataLoaded}
            query={query}
            nodeDefsSelectorVisible={nodeDefsSelectorVisible}
            onChangeQuery={onChangeQuery}
            setNodeDefsSelectorVisible={setNodeDefsSelectorVisible}
          />
          {/* TODO: Add table paginator here */}
        </div>

        <Visualizer
          query={query}
          data={data}
          dataEmpty={dataEmpty}
          dataLoaded={dataLoaded}
          dataLoading={dataLoading}
          nodeDefsSelectorVisible={nodeDefsSelectorVisible}
          offset={offset}
        />
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
