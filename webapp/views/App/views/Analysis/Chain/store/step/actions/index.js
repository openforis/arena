import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useSelect } from './useSelect'

export const useActions = ({ dirty, setDirty, chain, setChain, step, setStep }) => ({
  create: useCreate({ chain, setChain, step, setStep }),
  update: useUpdate({ dirty, setDirty, chain, setChain, step, setStep }),
  delete: useDelete({ chain, setChain, step, setStep }),
  select: useSelect({ chain, setChain, step, setStep }),
})
