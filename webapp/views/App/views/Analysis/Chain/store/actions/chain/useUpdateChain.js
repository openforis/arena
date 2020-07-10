import { useCallback } from 'react'

import * as A from '@core/arena'
import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useUpdateChain = ({ setState }) =>
  useCallback(({ name, value, state }) => {
    const chainEdit = A.pipe(State.getChainEdit, Chain.assocProp(name, value))(state)
    setState(State.assocChainEdit(chainEdit)(state))
  }, [])
