import './table.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'

import { RowData, RowHeader } from './Row'
import { useTable } from './store'

const Table = (props) => {
  const {
    query,
    data,
    dataEmpty,
    dataLoading,
    dataLoadingError,
    nodeDefLabelType,
    nodeDefsSelectorVisible,
    offset,
    onChangeQuery,
    setData,
  } = props

  const i18n = useI18n()
  const { nodeDefCols, colWidth, colIndexWidth } = useTable({ data, query, nodeDefsSelectorVisible, setData })

  if (!colWidth) return null

  if (dataEmpty && !dataLoading && !dataLoadingError) {
    return <div className="no-data">{i18n.t('dataView.dataVis.noData')}</div>
  }

  return (
    <>
      <div className="table__rows">
        <RowHeader
          colWidth={colWidth}
          colIndexWidth={colIndexWidth}
          nodeDefCols={nodeDefCols}
          nodeDefLabelType={nodeDefLabelType}
          onChangeQuery={onChangeQuery}
          query={query}
        />

        <div className="table__data-rows">
          {dataLoadingError && <div className="data-loading-error">{i18n.t('dataView.dataVis.errorLoadingData')}</div>}

          {data?.map((row, i) => {
            const rowNo = i + offset + 1
            return (
              <RowData
                key={rowNo}
                colIndexWidth={colIndexWidth}
                colWidth={colWidth}
                nodeDefCols={nodeDefCols}
                query={query}
                row={row}
                rowNo={rowNo}
              />
            )
          })}
        </div>
      </div>
    </>
  )
}

Table.propTypes = {
  query: PropTypes.object.isRequired,
  data: PropTypes.array,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool,
  dataLoadingError: PropTypes.bool,
  nodeDefLabelType: PropTypes.string.isRequired,
  nodeDefsSelectorVisible: PropTypes.bool.isRequired,
  offset: PropTypes.number.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  setData: PropTypes.func.isRequired,
}

Table.defaultProps = {
  dataLoading: false,
  dataLoadingError: false,
}

export default Table
