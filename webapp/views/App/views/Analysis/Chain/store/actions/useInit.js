import axios from 'axios'
import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'

import { AnalysisStorage } from '@webapp/service/storage'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useParams } from 'react-router'

export const useInit = ({ ChainState, StepState, CalculationState }) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()

  const { chain, step, stepDirty, calculation, calculationDirty } = AnalysisStorage.get()

  const { chainUuid } = useParams()

  const recover = () => {
    if (chain) {
      ChainState.setState({ chain })
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

    ChainState.setState({ chain: newChain })
  }
  const recoverOrCreate = chain && Chain.isTemporary(chain) ? recover : create

  const fetchOrRecoverChain = async () => {
    const { data: chainFetched } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)

    if (!A.isNull(chain) && Chain.getUuid(chain) === chainUuid) {
      recover()
    } else {
      ChainState.setState({ chain: chainFetched })
    }
  }

  return !A.isNull(chainUuid) ? fetchOrRecoverChain : recoverOrCreate
}
