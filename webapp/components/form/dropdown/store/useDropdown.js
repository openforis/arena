import { useState } from 'react'
import { useOnUpdate } from '@webapp/components/hooks'

import { useActions } from './actions'

export const useDropdown = ({ disabled, itemKey, itemLabel, readOnly, onBeforeChange, onChange, selection }) => {
  // utility getters
  const getItemKey = (item) => (itemKey.constructor === String ? item[itemKey] : itemKey(item))
  const getItemLabel = (item) => (itemLabel.constructor === String ? item[itemLabel] : itemLabel(item))
  const getSelectionLabel = () => (selection ? getItemLabel(selection) : null)

  // state/action properties
  const [inputValue, setInputValue] = useState(getSelectionLabel())
  const [opened, setOpened] = useState(false)

  const Actions = useActions({ onBeforeChange, onChange, setOpened })

  // utility setters
  const toggleOpened = () => (!disabled && !readOnly ? setOpened((openedPrev) => !openedPrev) : null)

  // on update selection: update input value
  useOnUpdate(() => {
    setInputValue(getSelectionLabel())
  }, [selection])

  return {
    Actions,

    inputValue,
    opened,

    getItemKey,
    getItemLabel,
    toggleOpened,
  }
}
