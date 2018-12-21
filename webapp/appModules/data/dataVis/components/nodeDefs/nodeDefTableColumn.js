import React from 'react'

// import { nodeDefSystemProps } from '../../../../surveyForm/nodeDefs/nodeDefSystemProps'
import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

const NodeDefTableColumn = ({nodeDef, row, lang}) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  return (
    <React.Fragment>
      {
        colNames.map((col, i) =>
          row
            ? <div key={i}>{row[col]}</div>
            : <div key={i}>{NodeDef.getNodeDefLabel(nodeDef, lang)}</div>
            // : <div key={i}>{col}</div>
        )
      }

    </React.Fragment>
  )
}

export default NodeDefTableColumn