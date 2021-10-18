import { useCallback } from 'react'

import * as A from '@core/arena'

import { State } from '../state'

export const useUpdateItemLabelFunction = ({ setState }) =>
  useCallback(({ itemLabelFunction, selection }) => {
    setState(
      A.pipe(
        State.assocItemLabelFunction(itemLabelFunction),
        State.assocInputValue(A.isEmpty(selection) ? '' : itemLabelFunction(selection))
      )
    )
  }, [])
