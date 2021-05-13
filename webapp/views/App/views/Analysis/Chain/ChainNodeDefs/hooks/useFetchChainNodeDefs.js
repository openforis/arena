import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { ChainActions, useChain, useChainEntityDefUuid } from '@webapp/store/ui/chain'

export const useFetchChainNodeDefs = () => {
  const dispatch = useDispatch()
  const chain = useChain()
  const entityDefUuid = useChainEntityDefUuid()

  useEffect(() => {
    if (entityDefUuid) {
      dispatch(ChainActions.fetchChainNodeDefs({ chainUuid: chain.uuid, entityDefUuid }))
    }
  }, [chain, entityDefUuid])
}
