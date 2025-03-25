import './dataQueryTable.scss'
import React from 'react'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { RowHeader, RowData } from './Row'
import { useTable } from './store'

const DataQueryTable = (props) => {
  const { data, dataEmpty, dataLoading = false, dataLoadingError = false, nodeDefLabelType, offset, setData } = props

  const i18n = useI18n()
  const query = DataExplorerSelectors.useQuery()
  const codesVisible = DataExplorerSelectors.useCodesVisible()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const { nodeDefCols, colWidth, colIndexWidth } = useTable({ data, setData })

  if (!colWidth) return null

  if (!Query.hasSelection(query)) {
    return <div className="no-data">{i18n.t('dataView.dataVis.noSelection')}</div>
  }
  if (dataEmpty && !dataLoading && !dataLoadingError) {
    return <div className="no-data">{i18n.t('dataView.dataVis.noData')}</div>
  }

  return (
    <div className="table__rows">
      <RowHeader
        codesVisible={codesVisible}
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
              codesVisible={codesVisible}
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
  )
}

DataQueryTable.propTypes = {
  data: PropTypes.array,
  dataEmpty: PropTypes.bool.isRequired,
  dataLoading: PropTypes.bool,
  dataLoadingError: PropTypes.bool,
  nodeDefLabelType: PropTypes.string.isRequired,
  offset: PropTypes.number.isRequired,
  setData: PropTypes.func.isRequired,
}

export default DataQueryTable
