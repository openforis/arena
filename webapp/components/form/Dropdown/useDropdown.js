import { useCallback, useEffect, useRef, useState } from 'react'

import * as A from '@core/arena'

export const useDropdown = ({
  minCharactersToAutocomplete,
  id,
  idInputProp,
  itemDescription,
  itemIcon,
  itemLabel,
  itemValue,
  itemsProp,
  multiple,
  onBeforeChange,
  onChangeProp,
  readOnly,
  selection,
  testId,
  title,
}) => {
  const selectRef = useRef(null)
  const inputValue = selectRef?.current?.inputRef?.value
  const searchMinCharsReached =
    !minCharactersToAutocomplete || minCharactersToAutocomplete <= inputValue?.trim()?.length

  const getProperty = (propOrFunction) => (item) =>
    propOrFunction.constructor === String ? A.prop(propOrFunction, item) : propOrFunction(item)

  const getOptionDescription = useCallback((item) => getProperty(itemDescription)(item), [itemDescription])
  const getOptionIcon = useCallback((item) => getProperty(itemIcon)(item), [itemIcon])
  const getOptionLabel = useCallback((item) => getProperty(itemLabel)(item), [itemLabel])
  const getOptionValue = useCallback((item) => getProperty(itemValue)(item), [itemValue])

  const [state, setState] = useState({ items: [], loading: false })

  const { items, loading } = state

  const fetchItems = useCallback(async () => {
    if (searchMinCharsReached && !loading) {
      setState({ items: [], loading: true })
    }
    const _items =
      searchMinCharsReached && itemsProp ? (Array.isArray(itemsProp) ? itemsProp : await itemsProp(inputValue)) : []

    setState({ items: _items, loading: false })
  }, [itemsProp, searchMinCharsReached, loading, inputValue])

  // fetch items on mount
  useEffect(() => {
    fetchItems()
  }, [])

  // fetch items on items prop update
  useEffect(() => {
    fetchItems()
  }, [itemsProp])

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
      if (!minCharactersToAutocomplete) return

      if (minCharactersToAutocomplete <= inputValue?.length) {
        fetchItems()
      } else {
        setState({ items: [] })
      }
    },
    [minCharactersToAutocomplete, fetchItems]
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

  const findOptionByValue = useCallback(
    (value) =>
      options
        .flatMap((option) => (option.options ? option.options : [option]))
        .find((option) => option.value === value),
    [options]
  )

  const getValue = useCallback(() => {
    if (A.isEmpty(selection)) return undefined

    if (multiple) {
      // selection is an array of items
      return selection.map((selectedItem) => findOptionByValue(getOptionValue(selectedItem)))
    }
    // selection is a single item
    return findOptionByValue(getOptionValue(selection))
  }, [findOptionByValue, getOptionValue, multiple, selection])

  const value = getValue()

  // prevent menu opening when readOnly is true
  const openMenuOnClick = !readOnly && searchMinCharsReached
  const menuIsOpen = readOnly || !searchMinCharsReached ? false : undefined

  return {
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
