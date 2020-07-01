import { useCreate } from './useCreate'
import { useUpdate } from './useUpdate'
import { useUpdateProps } from './useUpdateProps'
import { useDelete } from './useDelete'
import { useDismiss } from './useDismiss'
import { useSelect } from './useSelect'

export const useActions = ({
  dirty,
  setDirty,
  chain,
  setChain,
  step,
  setStep,
  stepOriginal,
  setStepOriginal,
  stepDirty,
  setStepDirty,
}) => ({
  create: useCreate({
    chain,
    setChain,
    step,
    setStep,
    stepDirty,
    setStepDirty,
    stepOriginal,
    setStepOriginal,
  }),
  update: useUpdate({ dirty, setDirty, chain, setChain, step, setStep, stepDirty, setStepDirty }),
  updateProps: useUpdateProps({
    dirty,
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    stepDirty,
    setStepDirty,
  }),
  delete: useDelete({ chain, setChain, step, setStep, stepDirty, setStepDirty }),
  dismiss: useDismiss({
    setDirty,
    chain,
    setChain,
    step,
    setStep,
    stepDirty,
    setStepDirty,
    stepOriginal,
    setStepOriginal,
  }),
  select: useSelect({ chain, setChain, step, setStep, stepDirty, setStepDirty, stepOriginal, setStepOriginal }),
})
