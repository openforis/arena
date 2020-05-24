import React from 'react'
import camelize from 'camelize'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as StringUtils from '@core/stringUtils'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProgressBar from '@webapp/commonComponents/progressBar'
import * as NodeDefUIProps from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import NodeDefTableCellHeader from '@webapp/loggedin/surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellHeader'

import TableColumnEdit from './tableColumnEdit'

const TableColumn = (props) => {
  const { nodeDef, row, colWidth, editMode } = props

  const i18n = useI18n()
  const { lang } = i18n

  const colNames = NodeDefTable.getColNames(nodeDef)
  const isHeader = !row
  const isData = Boolean(row)
  const noCols = editMode ? NodeDefUIProps.getFormFields(nodeDef).length : colNames.length
  const widthOuter = colWidth * noCols
  const widthInner = `${(1 / noCols) * 100}%`

  const getColKey = (col) => {
    const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(NodeDef.getType(nodeDef))}`
    const colName = camelize(NodeDefTable.extractColName(nodeDef, col))
    return `surveyForm.${nodeDefTypePrefix}.${colName}`
  }

  const getColValue = (col) => {
    const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null
    if (value && NodeDef.isDecimal(nodeDef)) {
      // Round decimal values to 2 decimal digits
      return Number(value).toFixed(2)
    }
    return value
  }

  const readOnly = NodeDef.isReadOnly(nodeDef) || NodeDef.isAnalysis(nodeDef)

  const editModeCell =
    editMode && isData ? (
      <TableColumnEdit nodeDef={nodeDef} record={row.record} cell={row.cols[NodeDef.getUuid(nodeDef)]} />
    ) : null

  return (
    <div className={`table__cell${!isHeader && readOnly ? ' readonly' : ''}`} style={{ width: widthOuter }}>
      {isHeader && (
        <div className="width100">
          {editMode ? (
            <NodeDefTableCellHeader nodeDef={nodeDef} label={NodeDef.getLabel(nodeDef, lang)} />
          ) : (
            <div>{NodeDef.getLabel(nodeDef, lang)}</div>
          )}
        </div>
      )}

      {editMode ? (
        editModeCell
      ) : (
        <div className="table__inner-cell">
          {colNames.map((col) => {
            if (isData) {
              const value = getColValue(col)
              return (
                <div key={col} style={{ width: widthInner }} className="ellipsis">
                  {value || (
                    <div style={{ width: '20%', marginLeft: '40%', opacity: '.5' }}>
                      <ProgressBar className="running progress-bar-striped" progress={100} showText={false} />
                    </div>
                  )}
                </div>
              )
            }
            if (isHeader && noCols > 1) {
              return (
                <div key={col} style={{ width: widthInner }}>
                  {i18n.t(getColKey(col))}
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

TableColumn.propTypes = {
  nodeDef: PropTypes.object.isRequired,
  row: PropTypes.object,
  colWidth: PropTypes.number.isRequired,
  editMode: PropTypes.bool,
}

TableColumn.defaultProps = {
  row: null,
  editMode: false,
}

export default TableColumn
