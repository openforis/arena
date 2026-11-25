import './AutocompleteDialog.scss'

import { useCallback, useMemo, useRef } from 'react'

import * as A from '@core/arena'

import { State, useLocalState } from './store'

type AutocompleteDialogProps = {
  inputField?: any
  sourceElement?: any
  items?: any[]
  itemRenderer?: any
  itemLabel?: string | ((...args: any[]) => any) // item label function or label property name
  itemKey?: string | ((...args: any[]) => any)
  className?: string
  onItemSelect?: (...args: any[]) => any
  onClose?: (...args: any[]) => any
}

const AutocompleteDialog = (props: AutocompleteDialogProps) => {
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
    (item) => (typeof itemLabel === 'string' ? A.prop(itemLabel, item) : itemLabel(item)),
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

export default AutocompleteDialog
