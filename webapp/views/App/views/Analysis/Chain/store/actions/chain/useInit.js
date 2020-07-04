import { useParams } from 'react-router'
import axios from 'axios'

import * as A from '@core/arena'

import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { AnalysisStorage } from '@webapp/service/storage/analysis'

import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useInit = ({ setState }) => {
  const surveyCycleKey = useSurveyCycleKey()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  return async () => {
    const chainEdit = AnalysisStorage.getChainEdit()

    let chainCurrent = null
    let stepCurrent = null

    if (
      (chainEdit && !chainUuid) ||
      (chainEdit && chainUuid && chainUuid === A.pipe(State.getChain, Chain.getUuid)(chainEdit))
    ) {
      // recover
      chainCurrent = State.getChainEdit(chainEdit)
      stepCurrent = State.getStepEdit(chainEdit)
    } else if (chainUuid) {
      // fetch
      const { data } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)
      chainCurrent = data
    } else {
      // create
      chainCurrent = Chain.newProcessingChain({
        [Chain.keysProps.cycles]: [surveyCycleKey],
      })
    }

    const { data: attributeUuidsOtherChains } = await axios.get(
      `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chainCurrent)}/attribute-uuids-other-chains`
    )

    setState(State.create({ chain: chainCurrent, step: stepCurrent, attributeUuidsOtherChains }))
  }
}
