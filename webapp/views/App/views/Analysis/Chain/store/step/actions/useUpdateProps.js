import * as Step from '@common/analysis/processingStep'

import { useUpdate } from './useUpdate'

export const useUpdateProps = ({ chainState, ChainState, state, setState, State }) => {
  const update = useUpdate({ chainState, ChainState, state, setState, State })
  return (props) => update({ stepUpdated: Step.mergeProps(props)(State.getStep(state)) })
}
