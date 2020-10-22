import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useUpdateChain = ({ setState }) =>
  useCallback(
    ({ name, value }) =>
      setState((statePrev) => {
        const chainEdit = State.getChainEdit(statePrev)
        const { chain: chainEditUpdated } = ChainController.assocProp({ chain: chainEdit, key: name, value })
        return State.assocChainEdit(chainEditUpdated)(statePrev)
      }),
    []
  )
