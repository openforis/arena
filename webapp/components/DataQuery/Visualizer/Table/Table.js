import './table.scss'
import React from 'react'
import PropTypes from 'prop-types'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { RowHeader, RowData } from './Row'
import { useTable } from './store'

const Table = (props) => {
  const { data, dataEmpty, dataLoading, dataLoadingError, nodeDefLabelType, offset, setData } = props

  const i18n = useI18n()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const { nodeDefCols, colWidth, colIndexWidth } = useTable({ data, setData })

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
  data: PropTypes.array,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool,
  dataLoadingError: PropTypes.bool,
  nodeDefLabelType: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  setData: PropTypes.func.isRequired,
}

Table.defaultProps = {
  dataLoading: false,
  dataLoadingError: false,
}

export default Table
