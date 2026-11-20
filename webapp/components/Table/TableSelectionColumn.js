import { Checkbox } from '@webapp/components/form'

export const TableSelectionColumn = ({ key = 'selected' } = {}) => ({
  key,
  renderHeader: ({ deselectAllItems, selectAllItems, allVisibleItemsSelected, selectedItemsCount, totalCount }) => {
    const allItemsSelected = selectedItemsCount === totalCount
    return (
      <Checkbox
        checked={allItemsSelected}
        indeterminate={selectedItemsCount > 0 && !allItemsSelected}
        onChange={(value) => {
          if (!value || allVisibleItemsSelected) {
            deselectAllItems()
          } else {
            selectAllItems()
          }
        }}
      />
    )
  },
  renderItem: ({ itemSelected, onItemSelectToggle }) => (
    <Checkbox checked={itemSelected} onChange={onItemSelectToggle} />
  ),
  width: '30px',
})
