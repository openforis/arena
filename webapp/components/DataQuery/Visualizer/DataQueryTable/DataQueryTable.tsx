import './DataQueryTable.scss'
import { useEffect, useMemo, useRef } from 'react'

import { Query } from '@common/model/query'

import * as ObjectUtils from '@core/objectUtils'

import { useQuerySortableVariables } from '@webapp/components/DataQuery/store'
import { DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

import { RowHeader, RowData } from './Row'
import { useTable, useTotals } from './store'
import type { NodeDefLabelType } from '@core/survey/nodeDef'

type DataQueryTableProps = {
  data?: any[]
  dataEmpty: boolean
  dataLoading?: boolean
  dataLoadingError?: boolean
  nodeDefLabelType: NodeDefLabelType
  offset: number
  setData: (...args: any[]) => any
}

const DataQueryTable = (props: DataQueryTableProps) => {
  const { data, dataEmpty, dataLoading = false, dataLoadingError = false, nodeDefLabelType, offset, setData } = props

  const i18n = useI18n()
  const query = DataExplorerSelectors.useQuery()
  const codesVisible = DataExplorerSelectors.useCodesVisible()
  const totalsVisibleSelected = DataExplorerSelectors.useTotalsVisible()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const totalsVisible =
    totalsVisibleSelected && Query.isModeAggregate(query) && Query.getMeasuresKeys(query).length === 1
  const totals = useTotals({ query, enabled: totalsVisible })
  const { nodeDefCols, colWidth, colIndexWidth } = useTable({ data, setData, percentageVisible: Boolean(totals) })
  const sortableVariables = useQuerySortableVariables({ query })
  const sortableVariablesByUuid = useMemo(() => ObjectUtils.toUuidIndexedObj(sortableVariables), [sortableVariables])
  const dataRowsRef = useRef(null)

  // scroll back to the first row when changing page
  useEffect(() => {
    dataRowsRef.current?.scrollTo({ top: 0 })
  }, [offset])

  if (!colWidth) return null

  if (!Query.hasSelection(query)) {
    return <div className="no-data">{i18n.t('dataView:dataVis.noSelection')}</div>
  }
  if (dataEmpty && !dataLoading && !dataLoadingError) {
    return <div className="no-data">{i18n.t('dataView:dataVis.noData')}</div>
  }

  return (
    <div className="table__rows">
      <RowHeader
        codesVisible={codesVisible}
        colWidth={colWidth}
        colIndexWidth={colIndexWidth}
        dataLoading={dataLoading}
        nodeDefCols={nodeDefCols}
        nodeDefLabelType={nodeDefLabelType}
        onChangeQuery={onChangeQuery}
        percentageVisible={Boolean(totals)}
        query={query}
        sortableVariablesByUuid={sortableVariablesByUuid}
      />

      <div className="table__data-rows" ref={dataRowsRef}>
        {dataLoadingError && <div className="data-loading-error">{i18n.t('dataView:dataVis.errorLoadingData')}</div>}

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
              totals={totals}
            />
          )
        })}
        {totals && !dataEmpty && (
          <RowData
            className="table__row--total"
            codesVisible={codesVisible}
            colIndexWidth={colIndexWidth}
            colWidth={colWidth}
            nodeDefCols={nodeDefCols}
            query={query}
            row={totals}
            rowNo={i18n.t('dataView:dataQuery.total')}
            totals={totals}
          />
        )}
      </div>
    </div>
  )
}

export default DataQueryTable
