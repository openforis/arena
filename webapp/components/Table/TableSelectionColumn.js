import React from 'react'

import { Checkbox } from '@webapp/components/form'

const checkboxStyle = { color: 'white' }

export const TableSelectionColumn = ({ key = 'selected' } = {}) => ({
  key,
  renderHeader: ({ deselectAllItems, selectAllItems, selectedItemsCount, totalCount, visibleItemsCount }) => {
    const allItemsSelected = selectedItemsCount === totalCount
    const allVisibleItemsSelected = selectedItemsCount === visibleItemsCount
    return (
      <Checkbox
        checked={allItemsSelected}
        controlStyle={checkboxStyle}
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
  renderItem: ({ itemSelected }) => <Checkbox allowClickEventBubbling checked={itemSelected} />,
  width: '30px',
})
