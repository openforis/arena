import * as ChainFactory from '../chainFactory'
import * as ChainUpdate from './chainUpdate'
import { assocCalculation } from './assocCalculation'

export const createStep = ({ chain, props = {} }) => {
  const step = ChainFactory.createStep({ chain, props })
  return { ...ChainUpdate.assocStep({ chain, step }), step }
}

export const createCalculation = ({ chain, step, nodeDefUuid = null, props = {} }) => {
  const calculation = ChainFactory.createCalculation({ step, nodeDefUuid, props })
  return {
    calculation,
    ...assocCalculation({ chain, step, calculation }),
  }
}
