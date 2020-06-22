import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { AnalysisActions } from '@webapp/service/storage'

export const useOnUpdateStep = ({ step, setStep, chain, setChain, setDirty }) => (props) => {
  const stepUpdated = Step.mergeProps(props)(step)
  const chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)

  setDirty(true)
  setChain(chainUpdated)
  setStep(stepUpdated)
  AnalysisActions.persistStep({ step: stepUpdated })
  AnalysisActions.persistChain({ chain: chainUpdated })
}
