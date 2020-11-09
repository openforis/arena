import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { ColumnHeader } from './Column'

const RowHeader = (props) => {
  const { colIndexWidth, colWidth, nodeDefCols, onChangeQuery, query, itemLabelFunction } = props

  const i18n = useI18n()

  return (
    <div className="table__row-header">
      <div style={{ width: colIndexWidth }}>{i18n.t('dataView.rowNum')}</div>

      {nodeDefCols.map((nodeDef) => (
        <ColumnHeader
          key={NodeDef.getUuid(nodeDef)}
          colWidth={colWidth}
          nodeDef={nodeDef}
          onChangeQuery={onChangeQuery}
          query={query}
          itemLabelFunction={itemLabelFunction}
        />
      ))}
    </div>
  )
}

RowHeader.propTypes = {
  colIndexWidth: PropTypes.number.isRequired,
  colWidth: PropTypes.number.isRequired,
  nodeDefCols: PropTypes.arrayOf(Object).isRequired,
  onChangeQuery: PropTypes.func.isRequired,
  query: PropTypes.object.isRequired,
  itemLabelFunction: PropTypes.func,
}

RowHeader.defaultProps = {
  itemLabelFunction: NodeDef.getLabel,
}

export default RowHeader
