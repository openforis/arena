import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { ColumnHeader } from './Column'

const RowHeader = (props) => {
  const {
    codesVisible,
    colIndexWidth,
    colWidth,
    dataLoading,
    nodeDefCols,
    nodeDefLabelType,
    onChangeQuery,
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
          query={query}
          sortableVariablesByUuid={sortableVariablesByUuid}
        />
      ))}
    </div>
  )
}

RowHeader.propTypes = {
  codesVisible: PropTypes.bool.isRequired,
  colIndexWidth: PropTypes.number.isRequired,
  colWidth: PropTypes.number.isRequired,
  dataLoading: PropTypes.bool,
  nodeDefCols: PropTypes.arrayOf(Object).isRequired,
  nodeDefLabelType: PropTypes.string.isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
  sortableVariablesByUuid: PropTypes.object.isRequired,
}

export default RowHeader
