import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useUpdateProps = ({ step, setStep, chain, setChain, setDirty, setStepDirty }) => {
  const update = useUpdate({ setStep, chain, setChain, setDirty, setStepDirty })
  return (props) => {
    const stepUpdated = Step.mergeProps(props)(step)
    update({ stepUpdated })
  }
}
