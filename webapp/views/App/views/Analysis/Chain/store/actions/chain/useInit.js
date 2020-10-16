import { useParams } from 'react-router'
import axios from 'axios'

import * as A from '@core/arena'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { AnalysisStorage } from '@webapp/service/storage/analysis'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useInit = ({ setState }) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  return async () => {
    const state = AnalysisStorage.getChainEdit()

    let chain = null
    let step = null
    let calculation = null

    if ((state && !chainUuid) || (state && chainUuid && chainUuid === A.pipe(State.getChain, Chain.getUuid)(state))) {
      // recover
      chain = State.getChainEdit(state)
      step = State.getStepEdit(state)
      calculation = State.getCalculationEdit(state)
    } else if (chainUuid) {
      // fetch
      const { data } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)
      chain = data
    } else {
      // create
      chain = ChainFactory.createChain({
        props: { [Chain.keysProps.cycles]: [surveyCycleKey] },
      })
    }

    const { data: attributeUuidsOtherChains } = await axios.get(
      `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/attribute-uuids-other-chains`
    )

    setState(
      State.create({
        chain,
        step,
        calculation,
        attributeUuidsOtherChains,
      })
    )
  }
}
