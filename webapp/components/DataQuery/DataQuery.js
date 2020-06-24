import './dataQuery.scss'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as A from '@core/arena'

import { useDataQuery } from './store'
import QueryNodeDefsSelector from './QueryNodeDefsSelector'
import ButtonBar from './ButtonBar'

const DataQuery = (props) => {
  const { query, onChangeQuery } = props

  const [nodeDefsSelectorVisible, setNodeDefsSelectorVisible] = useState(true)
  const { data } = useDataQuery({ query })

  return (
    <div className={classNames('data-query', { 'nodedefs-selector-off': !nodeDefsSelectorVisible })}>
      <QueryNodeDefsSelector query={query} onChangeQuery={onChangeQuery} />

      <div className={classNames('data-query__container', 'table', { edit: false, 'no-content': true })}>
        <div className="table__header">
          <ButtonBar
            hasData={!A.isEmpty(data)}
            query={query}
            nodeDefsSelectorVisible={nodeDefsSelectorVisible}
            onChangeQuery={onChangeQuery}
            setNodeDefsSelectorVisible={setNodeDefsSelectorVisible}
          />
          {/* TODO: Add table paginator here */}
        </div>
        {/* TODO: Add content visualizer here */}
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
