import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useUpdateProps = ({ chain, setChain, setDirty, state, setState, State }) => {
  const update = useUpdate({ chain, setChain, setDirty, state, setState, State })

  const step = State.getStep(state)

  return (props) => {
    const stepUpdated = Step.mergeProps(props)(step)
    update({ stepUpdated })
  }
}
