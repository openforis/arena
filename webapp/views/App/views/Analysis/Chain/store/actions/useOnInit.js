import axios from 'axios'
import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useOnInit = ({ setChain, setStep, setCalculation }) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()

  const chainSaved = AnalysisActions.getChain()
  const stepSaved = AnalysisActions.getStep()
  const calculationSaved = AnalysisActions.getCalculation()

  const { chainUuid } = useParams()

  const recover = () => {
    if (chainSaved) {
      setChain(chainSaved)
      if (stepSaved) {
        setStep(stepSaved)
        if (calculationSaved) {
          setCalculation(calculationSaved)
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
  const recoverOrCreate = chainSaved ? recover : create

  const fetchOrRecoverChain = async () => {
    const { data: chain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

    if (!A.isEmpty(chainSaved) && Chain.getUuid(chainSaved) === chainUuid) {
      recover()
    } else {
      setChain(chain)
    }
  }

  return chainUuid ? fetchOrRecoverChain : recoverOrCreate
}
