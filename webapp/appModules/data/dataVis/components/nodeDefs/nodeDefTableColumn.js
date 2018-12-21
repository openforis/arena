import React from 'react'

import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

const NodeDefTableColumn = ({nodeDef, row, lang, colWidth}) => {
  const colNames = NodeDefTable.getColNames(nodeDef)
  const noCols = colNames.length

  return (
    <div style={{width: colWidth * noCols, display: 'flex', flexWrap: 'wrap'}}>

      {
        !row &&
        <div style={{width: '100%'}}>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
      }

      {
        colNames.map((col, i) =>
          row
            ? <div key={i} style={{width: (1 / noCols * 100) + '%'}}>{row[col]}</div>
            : !row && noCols > 1
            ? <div key={i} style={{width: (1 / noCols * 100) + '%'}}>
              {NodeDefTable.extractColName(nodeDef, col)}
            </div>
            : null
        )
      }

    </div>
  )
}

export default NodeDefTableColumn