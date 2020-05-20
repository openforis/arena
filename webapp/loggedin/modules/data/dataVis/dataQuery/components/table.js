import './table.scss'
import React, { useRef } from 'react'

import { elementOffset } from '@webapp/utils/domUtils'

import TableRows from './tableRows'
import TableHeader from './tableHeader'
import { useTableState } from './useTableState'

const defaultColWidth = 70

const Table = () => {
  const {
    history,
    canEdit,
    lang,
    appSaving,
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    editMode,
    colsNumber,
    data,
    hasData,
    offset,
    limit,
    filter,
    sort,
    count,
    showTable,
    nodeDefSelectorsVisible,
  } = useTableState()

  const tableRef = useRef(null)
  const { width = defaultColWidth } = elementOffset(tableRef.current)
  const widthMax = width - defaultColWidth - 22
  const colWidthMin = 150
  const colWidth = widthMax > colsNumber * colWidthMin ? Math.floor(widthMax / colsNumber) : colWidthMin

  return (
    <div className={`data-query-table table${editMode ? ' edit' : ''}`} ref={tableRef}>
      {showTable && (
        <>
          <TableHeader
            appSaving={appSaving}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCols={nodeDefUuidCols}
            filter={filter}
            sort={sort}
            limit={limit}
            offset={offset}
            count={count}
            showPaginator={hasData}
            editMode={editMode}
            canEdit={canEdit}
            nodeDefSelectorsVisible={nodeDefSelectorsVisible}
          />

          {hasData && (
            <TableRows
              lang={lang}
              nodeDefCols={nodeDefCols}
              data={data}
              offset={offset}
              colWidth={colWidth}
              defaultColWidth={defaultColWidth}
              editMode={editMode}
              history={history}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Table
