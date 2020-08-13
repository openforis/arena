import React from 'react'
import PropTypes from 'prop-types'

import * as CategoryItem from '@core/survey/categoryItem'

import { useLang } from '@webapp/store/system'

const Checkbox = (props) => {
  const { edit, canEditRecord, item, readOnly, onItemAdd, onItemRemove, selectedItems } = props

  const lang = useLang()

  const selected = Boolean(selectedItems.find(CategoryItem.isEqual(item)))

  return (
    <button
      type="button"
      className={`btn btn-s deselectable${selected ? ' active' : ''}`}
      aria-disabled={edit || !canEditRecord || readOnly}
      onClick={() => {
        if (selected) onItemRemove(item)
        else onItemAdd(item)
      }}
    >
      {CategoryItem.getLabel(lang)(item)}
    </button>
  )
}

Checkbox.propTypes = {
  edit: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  item: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  onItemAdd: PropTypes.func,
  onItemRemove: PropTypes.func,
  selectedItems: PropTypes.arrayOf(PropTypes.object),
}

Checkbox.defaultProps = {
  edit: false,
  canEditRecord: false,
  onItemAdd: null,
  onItemRemove: null,
  readOnly: false,
  selectedItems: [],
}

export default Checkbox
