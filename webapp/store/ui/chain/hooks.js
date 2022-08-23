import { useSelector } from 'react-redux'

export const useChain = () => useSelector((state) => state.ui.chain.chain)

export const useChainRecordsCountByStep = () => useSelector((state) => state.ui.chain.recordsCountByStep)
