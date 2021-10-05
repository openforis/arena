import React from 'react'

export const ContentRowCell = (props) => {
  const { column, row } = props

  const { key, cellRenderer } = column

  return <div key={key}>{cellRenderer({ row })}</div>
}
