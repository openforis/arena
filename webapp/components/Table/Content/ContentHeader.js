import React from 'react'

import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

export const ContentHeader = (props) => {
  const i18n = useI18n()

  const { column, deselectAllItems, handleSortBy, selectAllItems, selectedItemsCount, sort, totalCount } = props
  const { key, header, renderHeader, sortable, sortField } = column

  return (
    <div key={key}>
      {sortable && <SortToggle sort={sort} handleSortBy={handleSortBy} field={sortField || key} />}
      {renderHeader && renderHeader({ deselectAllItems, selectAllItems, selectedItemsCount, totalCount })}
      {header ? i18n.t(header) : ''}
    </div>
  )
}
