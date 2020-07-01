import axios from 'axios'
import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useInit = ({ setChain, setStep, setCalculation, setStepDirty, setCalculationDirty }) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()

  const chainSaved = AnalysisActions.getChain()
  const { step: stepSaved, stepDirty } = AnalysisActions.getStep()
  const { calculation: calculationSaved, calculationDirty } = AnalysisActions.getCalculation()

  const { chainUuid } = useParams()

  const recover = () => {
    if (chainSaved) {
      setChain(chainSaved)
      if (stepSaved) {
        setStep(stepSaved)
        setStepDirty(stepDirty)
        if (calculationSaved) {
          setCalculation(calculationSaved)
          setCalculationDirty(calculationDirty)
        }
      }
    }
  }
  const create = () => {
    const newChain = Chain.newProcessingChain({
      [Chain.keysProps.cycles]: [surveyCycleKey],
    })

    setChain(newChain)
  }
  const recoverOrCreate = chainSaved && Chain.isTemporary(chainSaved) ? recover : create

  const fetchOrRecoverChain = async () => {
    const { data: chain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

    if (!A.isNull(chainSaved) && Chain.getUuid(chainSaved) === chainUuid) {
      recover()
    } else {
      setChain(chain)
    }
  }

  return !A.isNull(chainUuid) ? fetchOrRecoverChain : recoverOrCreate
}
