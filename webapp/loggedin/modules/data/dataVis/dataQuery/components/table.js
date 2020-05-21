import './table.scss'
import React, { useLayoutEffect, useRef, useState } from 'react'

import { elementOffset } from '@webapp/utils/domUtils'

import TableContent from './tableContent'
import TableHeader from './tableHeader'
import { useTableState } from './useTableState'

const defaultColWidth = 70

const Table = () => {
  const {
    canEdit,
    lang,
    appSaving,
    nodeDefUuidContext,
    nodeDefUuidCols,
    nodeDefCols,
    editMode,
    aggregateMode,
    colsNumber,
    data,
    hasData,
    offset,
    limit,
    filter,
    sort,
    count,
    hasTableAndCols,
    nodeDefSelectorsVisible,
  } = useTableState()
  const tableRef = useRef(null)
  const [colWidth, setColWidth] = useState(null)

  useLayoutEffect(() => {
    const { width } = elementOffset(tableRef.current)
    const widthMax = width - defaultColWidth - 22
    const colWidthMin = 150
    const colWidthUpdate = widthMax > colsNumber * colWidthMin ? Math.floor(widthMax / colsNumber) : colWidthMin
    setColWidth(colWidthUpdate)
  }, [nodeDefSelectorsVisible, colsNumber])

  let className = 'data-query-table table'
  className += editMode ? ' edit' : ''
  className += data && hasTableAndCols ? '' : ' no-content'

  return (
    <div className={className} ref={tableRef}>
      <TableHeader
        appSaving={appSaving}
        nodeDefUuidContext={nodeDefUuidContext}
        nodeDefUuidCols={nodeDefUuidCols}
        filter={filter}
        sort={sort}
        limit={limit}
        offset={offset}
        count={count}
        data={data}
        hasData={hasData}
        hasTableAndCols={hasTableAndCols}
        editMode={editMode}
        aggregateMode={aggregateMode}
        canEdit={canEdit}
        nodeDefSelectorsVisible={nodeDefSelectorsVisible}
      />

      {hasTableAndCols && data && (
        <TableContent
          lang={lang}
          nodeDefCols={nodeDefCols}
          data={data}
          offset={offset}
          colWidth={colWidth}
          defaultColWidth={defaultColWidth}
          editMode={editMode}
          hasData={hasData}
          hasTableAndCols={hasTableAndCols}
        />
      )}
    </div>
  )
}

export default Table
