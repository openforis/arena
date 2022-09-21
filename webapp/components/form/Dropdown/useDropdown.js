import { useCallback, useEffect, useRef, useState } from 'react'

import * as A from '@core/arena'

export const useDropdown = ({
  autocompleteMinChars,
  id,
  idInputProp,
  itemLabel,
  itemKey,
  itemsProp,
  onBeforeChange,
  onChangeProp,
  readOnly,
  selection,
  testId,
  title,
}) => {
  const selectRef = useRef(null)
  const inputValue = selectRef?.current?.inputRef?.value
  const searchMinCharsReached = !autocompleteMinChars || autocompleteMinChars <= inputValue?.trim()?.length

  const getOptionLabel = useCallback(
    (item) => (itemLabel.constructor === String ? A.prop(itemLabel, item) : itemLabel(item)),
    [itemLabel]
  )

  const getOptionValue = useCallback(
    (item) => (itemKey.constructor === String ? A.prop(itemKey, item) : itemKey(item)),
    [itemKey]
  )

  const [state, setState] = useState({ items: [], loading: false })

  const { items, loading } = state

  const fetchItems = useCallback(async () => {
    if (searchMinCharsReached && !loading) {
      setState({ items: [], loading: true })
    }
    const _items = itemsProp ? (Array.isArray(itemsProp) ? itemsProp : await itemsProp(inputValue)) : []
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
    (option) => (option ? items.find((itm) => getOptionValue(itm) === option.value) : null),
    [items, getOptionValue]
  )

  const onChange = useCallback(
    async (option) => {
      const item = getItemFromOption(option)
      if (!onBeforeChange || (await onBeforeChange(item))) {
        onChangeProp(item)
      }
    },
    [getItemFromOption, onBeforeChange, onChangeProp]
  )

  const onInputChange = useCallback(
    (inputValue) => {
      if (autocompleteMinChars) {
        if (autocompleteMinChars <= inputValue?.length) {
          fetchItems()
        } else {
          setState({ items: [] })
        }
      }
    },
    [autocompleteMinChars, fetchItems]
  )

  const options = items.map((item) => ({ value: getOptionValue(item), label: getOptionLabel(item) }))

  const emptySelection = A.isEmpty(selection)
  const selectedValue = emptySelection ? null : getOptionValue(selection)
  const value = emptySelection ? null : options.find((option) => option.value === selectedValue)

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
