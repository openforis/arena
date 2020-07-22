import { useCallback } from 'react'

import { clickedOutside } from '@webapp/utils/domUtils'

import { State } from '../state'

export const useOnOutsideClick = ({ onClose }) =>
  useCallback(({ event, list, state }) => {
    const inputField = State.getInputField(state)
    console.log(list, inputField)
    if (clickedOutside(list.current, event) && clickedOutside(inputField, event)) {
      onClose()
    }
  }, [])
