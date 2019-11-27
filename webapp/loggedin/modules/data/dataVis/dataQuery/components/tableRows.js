import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import ErrorBadge from '@webapp/commonComponents/errorBadge'
import { appModuleUri, dataModules } from '../../../../../appModules'
import TableColumn from './tableColumn'

const TableColumns = ({ nodeDefCols, row, lang, colWidth, editMode = false }) =>
  nodeDefCols.map(nodeDef => (
    <TableColumn
      key={NodeDef.getUuid(nodeDef)}
      nodeDef={nodeDef}
      row={row}
      lang={lang}
      colWidth={colWidth}
      editMode={editMode}
    />
  ))

const TableRows = ({
  nodeDefCols,
  data,
  offset,
  lang,
  colWidth,
  defaultColWidth,
  editMode,
  history,
}) => {
  const i18n = useI18n()

  return (
    <div className="table__content">
      <div className="table__rows">
        <div className="table__row-header">
          <div style={{ width: defaultColWidth }}>
            {i18n.t('dataView.rowNum')}
          </div>
          <TableColumns
            nodeDefCols={nodeDefCols}
            lang={lang}
            colWidth={colWidth}
            editMode={editMode}
          />
        </div>

        <div className="table__data-rows">
          {data.map((row, i) => {
            const { parentNodeUuid, record } = row

            const recordUuid = Record.getUuid(record)
            const recordEditUrl = `${appModuleUri(
              dataModules.record,
            )}${recordUuid}?parentNodeUuid=${parentNodeUuid}`
            const validation = Record.getValidation(record)

            return (
              <div key={i} className="table__row">
                <ErrorBadge
                  validation={validation}
                  showLabel={false}
                  className="error-badge-inverse"
                />

                <div style={{ width: defaultColWidth }}>
                  {i + offset + 1}
                  {editMode && (
                    <button
                      className="btn btn-s btn-edit"
                      title="View record"
                      onClick={() => history.push(recordEditUrl)}
                    >
                      <span className="icon icon-pencil2 icon-12px" />
                    </button>
                  )}
                </div>
                <TableColumns
                  nodeDefCols={nodeDefCols}
                  row={row}
                  colWidth={colWidth}
                  editMode={editMode}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TableRows
