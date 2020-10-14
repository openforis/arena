import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'

export const deleteCalculation = ({ chain, step, calculation }) => {
  const { step: stepUpdated } = StepUpdate.dissocCalculation({ step, calculation })
  const { chain: chainUpdated } = ChainUpdate.assocStep({ chain, step: stepUpdated })

  return {
    chain: chainUpdated,
    step: stepUpdated,
  }
}
