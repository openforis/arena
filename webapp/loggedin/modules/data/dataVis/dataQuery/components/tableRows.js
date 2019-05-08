import React from 'react'

import TableColumn from './tableColumn'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Record from '../../../../../../../common/record/record'

import { appModuleUri } from '../../../../../appModules'
import { dataModules } from '../../../dataModules'
import ErrorBadge from '../../../../../../commonComponents/errorBadge'

const defaultColWidth = 100

const TableColumns = ({ nodeDefCols, row, lang, colWidth, editMode = false }) => (
  nodeDefCols.map(nodeDef =>
    <TableColumn
      key={NodeDef.getUuid(nodeDef)}
      nodeDef={nodeDef}
      row={row}
      lang={lang}
      colWidth={colWidth}
      editMode={editMode}
    />
  )
)

const TableRows = ({ nodeDefCols, colNames, data, offset, lang, colWidth, editMode, history }) => (
  <div className="table__rows">

    <div className="table__row-header">
      <div style={{ width: defaultColWidth }}>Row #</div>
      <TableColumns
        nodeDefCols={nodeDefCols}
        lang={lang}
        colWidth={colWidth}
        editMode={editMode}/>
    </div>

    <div className="table__data-rows">
      {
        data.map((row, i) => {
          const { parentNodeUuid, record } = row

          const recordUuid = Record.getUuid(record)
          const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?parentNodeUuid=${parentNodeUuid}`
          const validation = Record.getValidation(record)

          return (
            <div key={i} className="table__row">
              <ErrorBadge
                validation={validation}
                showLabel={false}
                tooltipErrorMessage="Invalid record"/>
              <div style={{ width: defaultColWidth }}>
                {i + offset + 1}
                {
                  editMode &&
                  <button className="btn btn-s btn-of-light btn-edit"
                          title="View record"
                          onClick={() => history.push(recordEditUrl)}>
                    <span className="icon icon-pencil2 icon-16px"/>
                  </button>
                }
              </div>
              <TableColumns
                nodeDefCols={nodeDefCols}
                row={row}
                colWidth={colWidth}
                editMode={editMode}/>
            </div>
          )
        })
      }
    </div>
  </div>
)

export default TableRows