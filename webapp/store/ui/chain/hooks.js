import { useSelector } from 'react-redux'

export const useChain = () => useSelector((state) => state.ui.chain.chain)

export const useChainEntityDefUuid = () => useSelector((state) => state.ui.chain.entityDefUuid)

export const useChainNodeDefsCount = () => useSelector((state) => state.ui.chain.chainNodeDefsCount)

export const useChainNodeDefs = () => useSelector((state) => state.ui.chain.chainNodeDefs)
