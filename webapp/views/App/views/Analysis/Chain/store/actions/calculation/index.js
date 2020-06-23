import { useCreate } from './useCreate'
import { useDelete } from './useDelete'
import { useMove } from './useMove'

export const calculationActions = ({ chain, setChain, step, setStep, calculation, setCalculation }) => ({
  create: useCreate({ chain, setChain, step, setStep, setCalculation }),
  move: useMove({ step, setStep }),
  delete: useDelete({ step, setStep, calculation, setCalculation }),
})
