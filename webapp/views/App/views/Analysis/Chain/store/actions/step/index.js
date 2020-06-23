import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useSelect } from './useSelect'

export const stepActions = ({ chain, setChain, dirty, setDirty, step, setStep }) => ({
  create: useCreate({ chain, setChain, step, setStep }),
  update: useUpdate({ chain, setChain, step, setStep, dirty, setDirty }),
  delete: useDelete({ chain, setChain, step, setStep }),
  select: useSelect({ chain, setChain, step, setStep }),
})
