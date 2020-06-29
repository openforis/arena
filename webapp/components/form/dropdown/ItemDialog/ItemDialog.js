import './itemDialog.scss'
import React from 'react'
import PropTypes from 'prop-types'

const ItemDialog = (props) => {
  const { item, itemLabel, onKeyDown, onMouseDown } = props

  return (
    <div role="button" className={ItemDialog.className} onMouseDown={onMouseDown} onKeyDown={onKeyDown} tabIndex={0}>
      {itemLabel(item)}
    </div>
  )
}

ItemDialog.propTypes = {
  item: PropTypes.object.isRequired,
  itemLabel: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onMouseDown: PropTypes.func.isRequired,
}

ItemDialog.className = 'dropdown__list-item'

export default ItemDialog
