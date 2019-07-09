import React from 'react'

import ProgressBar from '../../../../../../commonComponents/progressBar'
import NodeDefTableCellHeader from '../../../../../surveyViews/surveyForm/nodeDefs/components/nodeDefTableCellHeader'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../../common/surveyRdb/nodeDefTable'

import TableColumnEdit from './tableColumnEdit'

const TableColumn = (props) => {
  const {
    nodeDef, row, lang, colWidth, editMode
  } = props

  const colNames = NodeDefTable.getColNames(nodeDef)
  const noCols = editMode ? 1 : colNames.length
  const isHeader = !row
  const isData = !!row
  const width = (1 / noCols * 100) + '%'

  return (
    <div className="table__cell" style={{ width: colWidth * noCols }}>

      {
        isHeader &&
        <div className="width100">
          {
            editMode
              ? (
                <NodeDefTableCellHeader
                  nodeDef={nodeDef}
                  label={NodeDef.getLabel(nodeDef, lang)}
                />
              )
              : (
                <div>
                  {NodeDef.getLabel(nodeDef, lang)}
                </div>
              )
          }
        </div>
      }

      {
        editMode
          ? isData
          ? (
            <TableColumnEdit
              nodeDef={nodeDef}
              record={row.record}
              cell={row.cols[NodeDef.getUuid(nodeDef)]}/>
          )
          : null
          : <div className="table__inner-cell">
            {
              colNames.map((col, i) =>
                isData ?
                  <div key={i} style={{ width }}>
                    {
                      row.hasOwnProperty(col)
                        ? row[col]
                        : (
                          <div style={{ width: '20%', marginLeft: '40%', opacity: '.5' }}>
                            <ProgressBar
                              className="running progress-bar-striped"
                              progress={100}
                              showText={false}/>
                          </div>
                        )
                    }
                  </div>
                  : isHeader && noCols > 1
                  ? (
                    <div key={i} style={{ width }}>
                      {NodeDefTable.extractColName(nodeDef, col)}
                    </div>
                  )
                  : null
              )
            }
          </div>
      }

    </div>
  )
}

export default TableColumn