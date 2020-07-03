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

    // the last edited chain is the same then the url uuid
    let chainCurrent = null
    if (chainEdit && chainUuid === A.pipe(State.getChain, Chain.getUuid)(chainEdit)) {
      setState(chainEdit)
    } else if (chainUuid) {
      // editing a chain
      const { data } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)
      chainCurrent = data
      setState(data)
    } else {
      // creating a chain
      chainCurrent = Chain.newProcessingChain({
        [Chain.keysProps.cycles]: [surveyCycleKey],
      })
    }
    const { data: attributeUuidsOtherChains } = await axios.get(
      `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chainCurrent)}/attribute-uuids-other-chains`
    )

    setState(State.create({ chain: chainCurrent, attributeUuidsOtherChains }))
  }
}
