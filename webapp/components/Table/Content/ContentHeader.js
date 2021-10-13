import React from 'react'

import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

export const ContentHeader = (props) => {
  const i18n = useI18n()

  const { column, handleSortBy, sort } = props
  const { key, header, sortable, sortField } = column

  return (
    <div key={key}>
      {sortable && <SortToggle sort={sort} handleSortBy={handleSortBy} field={sortField || key} />}
      {header ? i18n.t(header) : ''}
    </div>
  )
}
