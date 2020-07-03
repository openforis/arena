import axios from 'axios'
import * as R from 'ramda'

import { useSurveyId } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'

export const useGetAttributeUuidsOtherChains = ({
  attributesUuidsOtherChains,
  setAtrributesUuidsOtherChains,
  chainState,
  ChainState,
}) => {
  const surveyId = useSurveyId()
  const chain = ChainState.getChain(chainState)

  return () => {
    ;(async () => {
      if (!R.isNil(Chain.getUuid(chain)) && R.isEmpty(attributesUuidsOtherChains)) {
        const { data: attributeUuidsOtherChains } = await axios.get(
          `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/attribute-uuids-other-chains`
        )

        setAtrributesUuidsOtherChains(attributeUuidsOtherChains)
      }
    })()
  }
}
