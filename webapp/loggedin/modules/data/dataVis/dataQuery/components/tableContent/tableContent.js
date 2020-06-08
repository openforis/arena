import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import TableColumn from './tableColumn'

const TableContent = (props) => {
  const { nodeDefCols, data, offset, colWidth, defaultColWidth, editMode, hasData } = props
  const i18n = useI18n()

  return (
    <div className="table__content">
      {hasData ? (
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
              const rowNo = i + offset + 1
              const recordUuid = Record.getUuid(record)
              const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`

              return (
                <div key={String(i)} className="table__row">
                  <div style={{ width: defaultColWidth }}>
                    {editMode ? (
                      <Link type="button" className="btn-transparent" title="View record" to={recordEditUrl}>
                        {rowNo}
                        <span className="icon icon-link icon-right icon-12px" />
                      </Link>
                    ) : (
                      rowNo
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
      ) : (
        <div className="no-data">{i18n.t('dataView.dataVis.noData')}</div>
      )}
    </div>
  )
}

TableContent.propTypes = {
  nodeDefCols: PropTypes.array.isRequired,
  data: PropTypes.array,
  offset: PropTypes.number,
  colWidth: PropTypes.number,
  defaultColWidth: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,
  hasData: PropTypes.bool.isRequired,
}

TableContent.defaultProps = {
  data: null,
  offset: null,
  colWidth: null,
}

export default TableContent
