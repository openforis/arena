import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

import { ColumnHeader } from './Column'

type RowHeaderProps = {
  codesVisible: boolean
  colIndexWidth: number
  colWidth: number
  dataLoading?: boolean
  nodeDefCols: ArenaAnyNodeDef[]
  nodeDefLabelType: NodeDef.NodeDefLabelType
  onChangeQuery: (...args: any[]) => any
  percentageVisible?: boolean
  query: Query.QueryItem
  sortableVariablesByUuid: Record<string, any>
}

const RowHeader = (props: RowHeaderProps) => {
  const {
    codesVisible,
    colIndexWidth,
    colWidth,
    dataLoading,
    nodeDefCols,
    nodeDefLabelType,
    onChangeQuery,
    percentageVisible = false,
    query,
    sortableVariablesByUuid,
  } = props

  const i18n = useI18n()

  return (
    <div className="table__row-header">
      <div style={{ width: colIndexWidth }}>{i18n.t('dataView:rowNum')}</div>

      {nodeDefCols.map((nodeDef) => (
        <ColumnHeader
          key={NodeDef.getUuid(nodeDef)}
          codesVisible={codesVisible}
          colWidth={colWidth}
          dataLoading={dataLoading}
          nodeDef={nodeDef}
          nodeDefLabelType={nodeDefLabelType}
          onChangeQuery={onChangeQuery}
          percentageVisible={percentageVisible}
          query={query}
          sortableVariablesByUuid={sortableVariablesByUuid}
        />
      ))}
    </div>
  )
}

export default RowHeader
