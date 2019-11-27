import React from 'react'
import camelize from 'camelize'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as StringUtils from '@core/stringUtils'

import {useI18n} from '@webapp/commonComponents/hooks'
import ProgressBar from '@webapp/commonComponents/progressBar'
import * as NodeDefUIProps from '../../../../../surveyViews/surveyForm/nodeDefs/nodeDefUIProps'
import NodeDefTableCellHeader from '../../../../../surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellHeader'

import TableColumnEdit from './tableColumnEdit'

const TableColumn = props => {
  const {nodeDef, row, lang, colWidth, editMode} = props

  const i18n = useI18n()

  const colNames = NodeDefTable.getColNames(nodeDef)
  const isHeader = !row
  const isData = Boolean(row)
  const noCols = editMode
    ? NodeDefUIProps.getFormFields(nodeDef).length
    : colNames.length
  const widthOuter = colWidth * noCols
  const widthInner = (1 / noCols) * 100 + '%'

  const getColKey = (nodeDef, col) => {
    const nodeDefTypePrefix = `nodeDef${StringUtils.capitalizeFirstLetter(
      NodeDef.getType(nodeDef),
    )}`
    const colName = camelize(NodeDefTable.extractColName(nodeDef, col))
    return `surveyForm.${nodeDefTypePrefix}.${colName}`
  }

  return (
    <div className="table__cell" style={{width: widthOuter}}>
      {isHeader && (
        <div className="width100">
          {editMode ? (
            <NodeDefTableCellHeader
              nodeDef={nodeDef}
              label={NodeDef.getLabel(nodeDef, lang)}
            />
          ) : (
            <div>{NodeDef.getLabel(nodeDef, lang)}</div>
          )}
        </div>
      )}

      {editMode ? (
        isData ? (
          <TableColumnEdit
            nodeDef={nodeDef}
            record={row.record}
            cell={row.cols[NodeDef.getUuid(nodeDef)]}
          />
        ) : null
      ) : (
        <div className="table__inner-cell">
          {colNames.map((col, i) =>
            isData ? (
              <div key={i} style={{width: widthInner}} className="ellipsis">
                {row.hasOwnProperty(col) ? (
                  row[col]
                ) : (
                  <div style={{width: '20%', marginLeft: '40%', opacity: '.5'}}>
                    <ProgressBar
                      className="running progress-bar-striped"
                      progress={100}
                      showText={false}
                    />
                  </div>
                )}
              </div>
            ) : isHeader && noCols > 1 ? (
              <div key={i} style={{width: widthInner}}>
                {i18n.t(getColKey(nodeDef, col))}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

export default TableColumn
