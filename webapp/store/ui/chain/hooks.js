import { useSelector } from 'react-redux'
import { ChainState } from './state'

export const useChain = () => useSelector((state) => ChainState.getChain(state))

export const useChainRecordsCountByStep = () => useSelector((state) => ChainState.getRecordsCountByStep(state))
