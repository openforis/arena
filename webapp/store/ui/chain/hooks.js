import { useSelector } from 'react-redux'

export const useChain = () => useSelector((state) => state.ui.chain.chain)

export const useChainEntityDefUuid = () => useSelector((state) => state.ui.chain.entityDefUuid)
