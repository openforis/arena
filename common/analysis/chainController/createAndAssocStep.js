import * as ChainFactory from '../chainFactory'
import * as ChainUpdate from './chainUpdate'

export const createAndAssocStep = ({ chain, props = {} }) => {
  const step = ChainFactory.createStep({ chain, props })

  return { ...ChainUpdate.assocStep({ chain, step }), step }
}
