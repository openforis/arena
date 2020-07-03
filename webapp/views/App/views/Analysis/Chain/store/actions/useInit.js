import axios from 'axios'
import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'

import { AnalysisStorage } from '@webapp/service/storage'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useInit = ({
  setChain,

  StepState,
  CalculationState,
}) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()

  const { chain, step, stepDirty, calculation, calculationDirty } = AnalysisStorage.get()

  const { chainUuid } = useParams()

  const recover = () => {
    if (chain) {
      setChain(chain)
      if (step) {
        StepState.setState({
          step,
          stepDirty,
        })
        if (calculation) {
          CalculationState.setState({
            calculation,
            calculationDirty,
          })
        }
      }
    }
    AnalysisStorage.reset()
  }
  const create = () => {
    const newChain = Chain.newProcessingChain({
      [Chain.keysProps.cycles]: [surveyCycleKey],
    })

    setChain(newChain)
  }
  const recoverOrCreate = chain && Chain.isTemporary(chain) ? recover : create

  const fetchOrRecoverChain = async () => {
    const { data: chainFetched } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

    if (!A.isNull(chain) && Chain.getUuid(chain) === chainUuid) {
      recover()
    } else {
      setChain(chainFetched)
    }
  }

  return !A.isNull(chainUuid) ? fetchOrRecoverChain : recoverOrCreate
}
