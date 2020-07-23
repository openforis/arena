import { useCallback } from 'react'

import { clickedOutside } from '@webapp/utils/domUtils'

import { State } from '../state'

export const useOnOutsideClick = ({ onClose }) =>
  useCallback(
    ({ list, state }) => (event) => {
      const inputField = State.getInputField(state)
      if (clickedOutside(list.current, event) && clickedOutside(inputField, event)) {
        onClose()
      }
    },
    []
  )
