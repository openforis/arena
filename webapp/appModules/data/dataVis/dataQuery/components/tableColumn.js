import React from 'react'

import ProgressBar from '../../../../../commonComponents/progressBar'

import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

const TableColumn = (props) => {
  const { nodeDef, row, lang, colWidth } = props

  const colNames = NodeDefTable.getColNames(nodeDef)
  const noCols = colNames.length
  const isHeader = !row
  const isData = !!row
  const width = (1 / noCols * 100) + '%'

  return (
    <div style={{ width: colWidth * noCols, display: 'flex', flexWrap: 'wrap' }}>

      {
        isHeader &&
        <div style={{ width: '100%' }}>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
      }

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
            : isHeader && noCols > 1 ?
            <div key={i} style={{ width }}>
              {NodeDefTable.extractColName(nodeDef, col)}
            </div>
            : null
        )
      }

    </div>
  )
}

export default TableColumn