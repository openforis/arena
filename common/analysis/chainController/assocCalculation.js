import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'

export const assocCalculation = ({ chain, step, calculation }) => {
  const { step: stepUpdated } = StepUpdate.assocCalculation({ step, calculation })
  const { chain: chainUpdated } = ChainUpdate.assocStep({ chain, step: stepUpdated })

  return {
    chain: chainUpdated,
    step: stepUpdated,
  }
}
