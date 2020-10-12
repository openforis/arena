import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useUpdateChain = ({ setState }) =>
  useCallback(
    ({ name, value }) =>
      setState((statePrev) => {
        const chain = State.getChainEdit(statePrev)
        const chainUpdated = ChainController.assocProp({ chain, name, value })
        return State.assocChainEdit(chainUpdated)(statePrev)
      }),
    []
  )
