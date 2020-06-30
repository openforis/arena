import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useDelete } from './useDelete'
import { useSelect } from './useSelect'

export const useActions = ({ dirty, setDirty, chain, setChain, step, setStep, stepDirty, setStepDirty }) => ({
  create: useCreate({ chain, setChain, step, setStep, stepDirty, setStepDirty }),
  update: useUpdate({ dirty, setDirty, chain, setChain, step, setStep, stepDirty, setStepDirty }),
  delete: useDelete({ chain, setChain, step, setStep, stepDirty, setStepDirty }),
  select: useSelect({ chain, setChain, step, setStep, stepDirty, setStepDirty }),
})
