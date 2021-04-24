import { ChainActionTypes } from './actionTypes'

export const resetChainNodeDefs = () => ({ type: ChainActionTypes.chainNodeDefsUpdate, chainNodeDefs: [] })
