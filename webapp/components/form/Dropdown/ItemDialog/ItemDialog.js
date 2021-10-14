import './itemDialog.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { TestId } from '@webapp/utils/testId'

const ItemDialog = (props) => {
  const { item, itemKey, itemLabel, onKeyDown, onMouseDown } = props

  return (
    <div
      data-testid={TestId.dropdown.dropDownItem(itemKey(item))}
      role="button"
      className={ItemDialog.className}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {itemLabel(item)}
    </div>
  )
}

ItemDialog.propTypes = {
  item: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string]).isRequired,
  itemKey: PropTypes.func.isRequired,
  itemLabel: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
}

ItemDialog.className = 'dropdown__list-item'

export default ItemDialog
