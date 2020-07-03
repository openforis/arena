import { useUpdateChain } from '../../actions/chain/useUpdateChain'
import { useDelete } from '../../actions/chain/useDelete'
import { useUpdateCycles } from '../../actions/chain/useUpdateCycles'

export const useActions = ({ state, setState, State }) => ({
  update: useUpdateChain({ state, setState, State }),
  updateCycles: useUpdateCycles({ state, setState, State }),
  delete: useDelete({ state, setState, State }),
})
