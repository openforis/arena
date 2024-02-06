import { useCallback, useEffect, useRef, useState } from 'react'

import * as A from '@core/arena'

export const useDropdown = ({
  defaultSelection,
  id,
  idInputProp,
  itemDescription,
  itemIcon,
  itemLabel,
  itemValue,
  itemsProp,
  minCharactersToAutocomplete,
  multiple,
  onBeforeChange,
  onChangeProp,
  readOnly,
  selection,
  testId,
  title,
}) => {
  const selectRef = useRef(null)
  const getProperty = (propOrFunction) => (item) =>
    propOrFunction.constructor === String ? A.prop(propOrFunction, item) : propOrFunction(item)

  const getOptionDescription = useCallback((item) => getProperty(itemDescription)(item), [itemDescription])
  const getOptionIcon = useCallback((item) => getProperty(itemIcon)(item), [itemIcon])
  const getOptionLabel = useCallback((item) => String(getProperty(itemLabel)(item)), [itemLabel])
  const getOptionValue = useCallback((item) => getProperty(itemValue)(item), [itemValue])

  const asyncItemsLoading = itemsProp && !Array.isArray(itemsProp)

  const [state, setState] = useState({
    items: asyncItemsLoading ? [] : itemsProp,
    loading: false,
    inputValue: selectRef?.current?.inputRef?.value,
  })

  const updateState = useCallback((newProps) => setState((statePrev) => ({ ...statePrev, ...newProps })), [])

  const { items, loading, inputValue } = state

  const searchMinCharsReached =
    !minCharactersToAutocomplete || minCharactersToAutocomplete <= inputValue?.trim()?.length

  const fetchItems = useCallback(async () => {
    if (!searchMinCharsReached) return
    if (!loading) {
      updateState({ items: [], loading: true })
    }
    let _items = itemsProp ? await itemsProp(inputValue) : []
    if (_items?.data?.items) {
      // items is the result of a fetch
      _items = _items.data.items
      if (typeof _items === 'object') {
        _items = Object.values(_items)
      }
    }
    updateState({ items: _items, loading: false })
  }, [inputValue, itemsProp, loading, searchMinCharsReached, updateState])

  const initializeItems = useCallback(async () => {
    if (!asyncItemsLoading) {
      updateState({ items: itemsProp })
    } else {
      await fetchItems()
    }
  }, [asyncItemsLoading, updateState, itemsProp, fetchItems])

  // fetch items on items prop or input value update (only if async items loading is active)
  useEffect(() => {
    initializeItems()
  }, [asyncItemsLoading, itemsProp, inputValue])

  // set title to control component
  useEffect(() => {
    if (title) {
      selectRef.current.controlRef.title = title
    }
  }, [title])

  // set id and test id to input component
  const inputId = id || idInputProp || testId
  useEffect(() => {
    if (inputId) {
      const input = selectRef.current.inputRef
      input.id = inputId
      input.dataset.testid = inputId
    }
  }, [inputId])

  const getItemFromOption = useCallback(
    (option) => {
      if (!option) return null
      const flattenItems = items.flatMap((item) => (item.options ? item.options : [item]))
      return flattenItems.find((item) => getOptionValue(item) === option.value)
    },
    [items, getOptionValue]
  )

  const onChange = useCallback(
    async (selection) => {
      const options = multiple ? selection : [selection]
      const items = options.map(getItemFromOption)
      const paramToPass = multiple ? items : items[0]
      if (!onBeforeChange || (await onBeforeChange(paramToPass))) {
        onChangeProp(paramToPass)
      }
    },
    [getItemFromOption, multiple, onBeforeChange, onChangeProp]
  )

  const onInputChange = useCallback(
    (inputValue) => {
      updateState({ inputValue })
    },
    [updateState]
  )

  const itemToOption = useCallback(
    (item) => ({
      description: getOptionDescription(item),
      icon: getOptionIcon(item),
      label: getOptionLabel(item),
      value: getOptionValue(item),
      ...(item.options ? { options: item.options } : {}),
    }),
    [getOptionDescription, getOptionIcon, getOptionLabel, getOptionValue]
  )

  const options = items.map(itemToOption)

  const selectionToValue = useCallback(
    (sel) => {
      if (sel === null) return null // force resetting selection
      if (A.isEmpty(sel)) return undefined // allows using defaultSelection, if specified

      if (multiple) {
        // selection is an array of items
        return sel.map(itemToOption)
      }
      // selection is a single item
      return itemToOption(sel)
    },
    [itemToOption, multiple]
  )

  const defaultValue = selectionToValue(defaultSelection)
  const value = selectionToValue(selection)

  // prevent menu opening when readOnly is true
  const openMenuOnClick = !readOnly && searchMinCharsReached
  const menuIsOpen = readOnly || !searchMinCharsReached ? false : undefined

  return {
    defaultValue,
    inputId,
    loading,
    menuIsOpen,
    onChange,
    onInputChange,
    openMenuOnClick,
    options,
    selectRef,
    value,
  }
}
