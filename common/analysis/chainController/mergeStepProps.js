import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'

export const mergeStepProps = ({ chain, step, props }) => {
  const { step: stepUpdated } = StepUpdate.mergeProps({ step, props })
  const { chain: chainUpdated } = ChainUpdate.assocStep({ chain, step: stepUpdated })
  return {
    chain: chainUpdated,
    step: stepUpdated,
  }
}
