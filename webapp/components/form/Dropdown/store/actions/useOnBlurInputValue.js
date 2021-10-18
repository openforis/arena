import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'
import { getItemsDialog } from './getItemsDialog'

export const useOnBlurInputValue = ({ onChange }) =>
  useCallback(async ({ value = '', state, selection }) => {
    const itemsDialog = await getItemsDialog({ state, value })

    if (
      !A.isEmpty(selection) &&
      (A.isEmpty(value) ||
        A.isEmpty(itemsDialog) ||
        !itemsDialog.some((item) => String(State.getItemLabelFunction(state)(item)) === String(value)))
    ) {
      await onChange(null)
    }
  }, [])
