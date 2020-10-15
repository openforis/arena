import * as ChainFactory from '../chainFactory'
import * as ChainUpdate from './chainUpdate'
import { assocCalculation } from './assocCalculation'

export const createAndAssocStep = ({ chain, props = {} }) => {
  const step = ChainFactory.createStep({ chain, props })
  return { ...ChainUpdate.assocStep({ chain, step }), step }
}

export const createAndAssocCalculation = ({ chain, step, nodeDefUuid = null, props = {} }) => {
  const calculation = ChainFactory.createCalculation({ step, nodeDefUuid, props })
  return {
    calculation,
    ...assocCalculation({ chain, step, calculation }),
  }
}
