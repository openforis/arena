import React from 'react'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import ErrorBadge from '@webapp/commonComponents/errorBadge'
import { appModuleUri, dataModules } from '@webapp/app/appModules'
import TableColumn from './tableColumn'

const TableRows = ({ nodeDefCols, data, offset, colWidth, defaultColWidth, editMode }) => {
  const i18n = useI18n()
  const history = useHistory()

  return (
    <div className="table__content">
      <div className="table__rows">
        <div className="table__row-header">
          <div style={{ width: defaultColWidth }}>{i18n.t('dataView.rowNum')}</div>
          {nodeDefCols.map((nodeDef) => (
            <TableColumn key={NodeDef.getUuid(nodeDef)} nodeDef={nodeDef} colWidth={colWidth} editMode={editMode} />
          ))}
        </div>

        <div className="table__data-rows">
          {data.map((row, i) => {
            const { parentUuid, record } = row

            const recordUuid = Record.getUuid(record)
            const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`
            const validation = Record.getValidation(record)

            return (
              <div key={String(i)} className="table__row">
                <ErrorBadge validation={validation} showLabel={false} className="error-badge-inverse" />

                <div style={{ width: defaultColWidth }}>
                  {i + offset + 1}
                  {editMode && (
                    <button
                      type="button"
                      className="btn btn-s btn-edit"
                      title="View record"
                      onClick={() => history.push(recordEditUrl)}
                    >
                      <span className="icon icon-pencil2 icon-12px" />
                    </button>
                  )}
                </div>
                {nodeDefCols.map((nodeDef) => (
                  <TableColumn
                    key={NodeDef.getUuid(nodeDef)}
                    nodeDef={nodeDef}
                    row={row}
                    colWidth={colWidth}
                    editMode={editMode}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

TableRows.propTypes = {
  nodeDefCols: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  offset: PropTypes.number.isRequired,
  colWidth: PropTypes.number.isRequired,
  defaultColWidth: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,
}

export default TableRows
