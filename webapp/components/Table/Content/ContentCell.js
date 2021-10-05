import React from 'react'

export const ContentCell = (props) => {
  const { column, row } = props

  const { key, cellRenderer } = column

  return <div key={key}>{cellRenderer({ row })}</div>
}
