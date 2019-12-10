import React, { useEffect, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import * as CollectImportReportState from '@webapp/loggedin/modules/home/collectImportReport/collectImportReportState'

import { updateCollectImportReportRowsScrollTop } from '@webapp/loggedin/modules/home/collectImportReport/actions'
import TableRow from './tableRow'

const TableRows = props => {
  const { reportItems } = props

  const rowsRef = useRef(null)
  const dispatch = useDispatch()
  const rowsScrollTop = useSelector(CollectImportReportState.getRowsScrollTop)

  useEffect(() => {
    if (rowsScrollTop) {
      rowsRef.current.scrollTop = rowsScrollTop
    }
  }, [])

  return (
    <div className="table__content">
      <div
        className="table__rows"
        ref={rowsRef}
        onScroll={() => dispatch(updateCollectImportReportRowsScrollTop(rowsRef.current.scrollTop))}
      >
        {reportItems.map((item, i) => (
          <TableRow key={i} idx={i} item={item} />
        ))}
      </div>
    </div>
  )
}

export default TableRows
