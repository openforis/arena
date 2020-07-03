import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

export const useCreate = ({ chain, setChain, stepState, StepState, setState }) => {
  return () => {
    const step = StepState.getStep(stepState)
    const calculation = Chain.newProcessingStepCalculation(step)

    const stepWithCalculation = Step.assocCalculation(calculation)(step)
    const chainWithStep = Chain.assocProcessingStep(stepWithCalculation)(chain)

    setChain(chainWithStep)

    StepState.setState({
      step: stepWithCalculation,
    })

    setState({
      calculation,
      calculationOriginal: {},
      calculationDirty: true,
    })
  }
}
