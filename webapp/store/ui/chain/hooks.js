import { useSelector } from 'react-redux'

import { useAuthCanUseAnalysis } from '@webapp/store/user'

import { ChainState } from './state'

export const useChain = () => useSelector((state) => ChainState.getChain(state))

export const useChainRecordsCountByStep = () => useSelector((state) => ChainState.getRecordsCountByStep(state))

export const useChainEditLocked = () => useSelector((state) => ChainState.isChainEditLocked(state))

export const useChainEditable = () => {
  const canUseAnalysis = useAuthCanUseAnalysis()
  const chainEditLocked = useChainEditLocked()
  return canUseAnalysis && !chainEditLocked
}
