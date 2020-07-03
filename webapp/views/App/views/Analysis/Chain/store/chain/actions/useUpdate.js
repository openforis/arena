import * as Chain from '@common/analysis/processingChain'

export const useUpdate = ({ state, setState, State }) => ({ name, value }) =>
  setState({
    chain: Chain.assocProp(name, value)(State.getChain(state)),
    dirty: true,
  })
