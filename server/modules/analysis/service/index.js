import { ChainNodeDefRepository } from '../repository/chainNodeDef'
import { ChainNodeDefAggregateRepository } from '../repository/chainNodeDefAggregate'

export { create } from './create'
export { update } from './update'

export {
  // ======  READ - Chain
  countChains,
  fetchChains,
  fetchChain,
  // ======  READ - Calculations
  fetchCalculationAttributeUuids,
  // ======  READ - Variables Previous Steps
  fetchVariablesPrevSteps,
  // ======  UPDATE - Chain
  updateChainStatusExec,
  // ======  DELETE - Chain
  deleteChain,
  // ======  DELETE - Step
  deleteStep,
  // ======  DELETE - Calculation
  deleteCalculation,
  // ==== ALL
  persistAll,
} from '../manager'

export { generateScript, fetchStepData, persistResults, persistUserScripts } from './rChain'
export { generateRStudioToken, checkRStudioToken } from './rStudio'

// chain node def
export const countChainNodeDefs = ChainNodeDefRepository.count
export const getManyChainNodeDefs = ChainNodeDefRepository.getMany
export const getAllChainNodeDefs = ChainNodeDefRepository.getAll
export { updateChainNodeDef } from './updateChainNodeDef'
export const updateIndexesChainNodeDefs = ChainNodeDefRepository.updateIndexes

export const getAllChainNodeDefsAggregate = ChainNodeDefAggregateRepository.getAll
