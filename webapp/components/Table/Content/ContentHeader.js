import React from 'react'
import PropTypes from 'prop-types'

import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'

import { TableColumnPropType } from '../tablePropTypes'

export const ContentHeader = (props) => {
  const {
    column,
    deselectAllItems,
    handleSortBy,
    selectAllItems,
    selectedItemsCount,
    sort,
    totalCount,
    visibleItemsCount,
  } = props

  const i18n = useI18n()
  const { key, header, renderHeader, headerIsTranslationKey = true, sortable, sortField } = column

  return (
    <div key={key}>
      {sortable && <SortToggle sort={sort} handleSortBy={handleSortBy} field={sortField || key} />}
      {renderHeader?.({ deselectAllItems, selectAllItems, selectedItemsCount, totalCount, visibleItemsCount })}
      {header ? (headerIsTranslationKey && i18n.exists(header) ? i18n.t(header) : header) : ''}
    </div>
  )
}

ContentHeader.propTypes = {
  column: TableColumnPropType.isRequired,
  deselectAllItems: PropTypes.func,
  handleSortBy: PropTypes.func,
  selectAllItems: PropTypes.func,
  selectedItemsCount: PropTypes.number,
  sort: PropTypes.object,
  totalCount: PropTypes.number,
  visibleItemsCount: PropTypes.number,
}
