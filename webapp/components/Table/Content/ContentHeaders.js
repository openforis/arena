import React from 'react'

import { ContentHeader } from './ContentHeader'

export const ContentHeaders = (props) => {
  const { columns } = props

  return (
    <>
      {columns.map((column) => (
        <ContentHeader column={column} />
      ))}
    </>
  )
}
