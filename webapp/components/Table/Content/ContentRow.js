import React from 'react'

import { ContentCell } from './ContentCell'

export const ContentRow = (props) => {
  const { columns, row } = props

  return (
    <>
      {columns.map((column) => (
        <ContentCell column={column} row={row} />
      ))}
    </>
  )
}
