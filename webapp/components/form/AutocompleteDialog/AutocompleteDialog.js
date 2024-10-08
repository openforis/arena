import './AutocompleteDialog.scss'

import React, { useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useLocalState, State } from './store'

const AutocompleteDialog = (props) => {
  const {
    className = '',
    inputField = null,
    itemLabel = () => '',
    itemKey = null,
    items = [],
    itemRenderer: ItemRenderer,
    onItemSelect = null,
    onClose = null,
    sourceElement = null, // Used to calculate the size of the dialog if available, otherwise the input field is used
  } = props
  const list = useRef(null)

  const itemLabelFunction = useCallback(
    (item) => (itemLabel.constructor === String ? A.prop(itemLabel, item) : itemLabel(item)),
    [itemLabel]
  )

  const { state, Actions } = useLocalState({
    inputField,
    sourceElement,
    items,
    itemLabelFunction,
    itemKey,
    onItemSelect,
    onClose,
    list,
  })

  const calculatedPosition = useMemo(
    () => State.calculatePosition({ sourceElement, inputField }),
    [sourceElement, inputField]
  )

  return (
    <div ref={list} className={`autocomplete-list ${className}`} style={{ ...calculatedPosition }}>
      {items.map((item) => (
        <ItemRenderer
          key={State.getItemKey(state)(item)}
          tabIndex="0"
          item={item}
          itemKey={State.getItemKey(state)}
          itemLabel={itemLabelFunction}
          onKeyDown={Actions.onListItemKeyDown({
            state,
          })}
          onMouseDown={() => onItemSelect(item)}
        />
      ))}
    </div>
  )
}

AutocompleteDialog.propTypes = {
  inputField: PropTypes.any,
  sourceElement: PropTypes.any,
  items: PropTypes.array,
  itemRenderer: PropTypes.any,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]), // item label function or label property name
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string,
  onItemSelect: PropTypes.func,
  onClose: PropTypes.func,
}

export default AutocompleteDialog
