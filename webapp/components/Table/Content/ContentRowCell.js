import React from 'react'

export const ContentRowCell = (props) => {
  const { active, column, item } = props

  const { key, renderItem } = column

  return <div key={key}>{renderItem({ item, active })}</div>
}
