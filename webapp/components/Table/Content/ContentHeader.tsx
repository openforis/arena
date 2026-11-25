import { SortToggle } from '@webapp/components/Table'
import { useI18n } from '@webapp/store/system'
import type { TableColumn } from '../tableColumn'
import type { TableSelectionSortProps } from '../tableProps'

const getHeaderText = ({ header, headerIsTranslationKey, i18n }) => {
  if (!header) return ''
  return headerIsTranslationKey && i18n.exists(header) ? i18n.t(header) : header
}

type ContentHeaderProps = TableSelectionSortProps & {
  column: TableColumn
}

export const ContentHeader = (props: ContentHeaderProps) => {
  const {
    column,
    deselectAllItems,
    handleSortBy,
    selectAllItems,
    selectedItemsCount,
    sort,
    totalCount,
    allVisibleItemsSelected,
  } = props

  const i18n = useI18n()
  const { key, header, renderHeader, headerIsTranslationKey = true, sortable, sortField } = column

  return (
    <div key={key}>
      {sortable && <SortToggle sort={sort} handleSortBy={handleSortBy} field={sortField || key} />}
      {renderHeader?.({ deselectAllItems, selectAllItems, selectedItemsCount, totalCount, allVisibleItemsSelected })}
      {getHeaderText({ header, headerIsTranslationKey, i18n })}
    </div>
  )
}
