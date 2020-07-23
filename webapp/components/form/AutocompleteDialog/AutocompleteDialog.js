import './AutocompleteDialog.scss'

import React, { useRef, useMemo } from 'react'
import PropTypes from 'prop-types'

import { useLocalState, State } from './store'

const AutocompleteDialog = (props) => {
  const {
    inputField,
    sourceElement,
    items,
    itemRenderer: ItemRenderer,
    itemLabel,
    itemKey,
    className,
    onItemSelect,
    onClose,
  } = props
  const list = useRef(null)
  const { state, Actions } = useLocalState({
    inputField,
    sourceElement,
    items,
    itemLabel,
    itemKey,
    onItemSelect,
    onClose,
    list,
  })

  const calculatedPosition = useMemo(() => State.calculatePosition(state), [
    State.getSourceElement(state),
    State.getInputField(state),
  ])

  return (
    <div ref={list} className={`autocomplete-list ${className}`} style={{ ...calculatedPosition }}>
      {items.map((item) => (
        <ItemRenderer
          key={State.getItemKey(state)(item)}
          tabIndex="0"
          item={item}
          itemLabel={State.getItemLabel(state)}
          onKeyDown={Actions.onListItemKeyDown({
            list,
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
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  className: PropTypes.string,
  onItemSelect: PropTypes.func,
  onClose: PropTypes.func,
}

AutocompleteDialog.defaultProps = {
  items: [],
  itemRenderer: null,
  itemLabel: null,
  itemKey: null,
  inputField: null,
  sourceElement: null, // Used to calculate the size of the dialog if available, otherwise the input field is used
  className: '',
  onItemSelect: null,
  onClose: null,
}

export default AutocompleteDialog
