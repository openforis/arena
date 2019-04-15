import React from 'react'
import * as R from 'ramda'

import ProgressBar from '../../../../../commonComponents/progressBar'
import NodeDefTableHeader from '../../../../surveyForm/nodeDefs/components/nodeDefTableHeader'

import NodeDef from '../../../../../../common/survey/nodeDef'
import NodeDefTable from '../../../../../../common/surveyRdb/nodeDefTable'

import TableColumnEdit from './tableColumnEdit'

import { appModuleUri } from '../../../../appModules'
import { dataModules } from '../../../dataModules'

const TableColumn = (props) => {
  const {
    nodeDef, row, lang, colWidth, editMode,
    history
  } = props

  const colNames = NodeDefTable.getColNames(nodeDef)
  const noCols = editMode ? 1 : colNames.length
  const isHeader = !row
  const isData = !!row
  const width = (1 / noCols * 100) + '%'

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const { record_uuid: recordUuid } = isData ? row : {}
  const parentNodeUuid = R.path(['cols', nodeDefUuid, 'parentUuid'], row)
  const recordEditUrl = appModuleUri(dataModules.record) + recordUuid + `?parentNodeUuid=${parentNodeUuid}&nodeDefUuid=${nodeDefUuid}`

  return (
    <div className="table__cell" style={{ width: colWidth * noCols }}>

      {
        isHeader &&
        <div style={{ width: '100%' }}>
          {
            editMode &&
            <NodeDefTableHeader nodeDef={nodeDef} label={NodeDef.getLabel(nodeDef, lang)}/>
          }
          {
            !editMode &&
            <div>
              {NodeDef.getLabel(nodeDef, lang)}
            </div>
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
            {colNames.map((col, i) =>
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

      {
        isData &&
        <button className="btn btn-s btn-of-light btn-edit"
                title="Edit record"
                onClick={() => history.push(recordEditUrl)}>
          <span className="icon icon-pencil2 icon-16px"/>
        </button>
      }

    </div>
  )
}

export default TableColumn