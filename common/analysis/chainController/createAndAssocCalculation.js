import * as ChainFactory from '../chainFactory'
import { assocCalculation } from './assocCalculation'

export const createAndAssocCalculation = ({ chain, step, nodeDefUuid = null, props = {} }) => {
  const calculation = ChainFactory.createCalculation({ step, nodeDefUuid, props })

  return {
    calculation,
    ...assocCalculation({ chain, step, calculation }),
  }
}
