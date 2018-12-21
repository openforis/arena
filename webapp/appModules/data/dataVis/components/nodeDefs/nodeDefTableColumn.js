import React from 'react'

// import { nodeDefSystemProps } from '../../../../surveyForm/nodeDefs/nodeDefSystemProps'
import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

const NodeDefTableColumn = ({nodeDef, row, lang, colWidth}) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  return (
    <React.Fragment>
      {
        colNames.map((col, i) =>
            row
              ? <div key={i} style={{width: colWidth}}>{row[col]}</div>
              : <div key={i} style={{width: colWidth}}>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
          // : <div key={i}>{col}</div>
        )
      }

    </React.Fragment>
  )
}

export default NodeDefTableColumn