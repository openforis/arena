import React from 'react'

export const ContentRowCell = (props) => {
  const { column, item } = props

  const { key, renderItem } = column

  return <div key={key}>{renderItem({ item })}</div>
}
