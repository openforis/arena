import { useSelector } from 'react-redux'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

export const useChainEdit = () => {
  const chain = useSelector(ChainState.getProcessingChain)
  const chainDirty = useSelector(ChainState.isDirty)
  const editingChain = useSelector(ChainState.isEditingChain)

  const step = useSelector(StepState.getProcessingStep)
  const stepDirty = useSelector(StepState.isDirty)
  const editingStep = useSelector(StepState.isEditingStep)
  const stepNext = useSelector(StepState.getProcessingStepNext)
  const stepPrev = useSelector(StepState.getProcessingStepPrev)

  const calculation = useSelector(CalculationState.getCalculation)
  const calculationDirty = useSelector(CalculationState.isDirty)
  const editingCalculation = useSelector(CalculationState.isEditingCalculation)

  const dirty = calculationDirty || stepDirty || chainDirty

  return {
    chain,
    chainDirty,
    editingChain,
    step,
    stepDirty,
    editingStep,
    stepNext,
    stepPrev,
    calculation,
    calculationDirty,
    editingCalculation,
    dirty,
  }
}
