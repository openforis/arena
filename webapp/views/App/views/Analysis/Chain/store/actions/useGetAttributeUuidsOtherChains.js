import axios from 'axios'
import * as R from 'ramda'

import { useSurveyId } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'

export const useGetAttributeUuidsOtherChains = ({
  attributesUuidsOtherChains,
  setAtrributesUuidsOtherChains,
  chain,
}) => {
  const surveyId = useSurveyId()

  return () => {
    ;(async () => {
      if (!R.isEmpty(chain) && R.isEmpty(attributesUuidsOtherChains)) {
        const { data: attributeUuidsOtherChains } = await axios.get(
          `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(chain)}/attribute-uuids-other-chains`
        )

        setAtrributesUuidsOtherChains(attributeUuidsOtherChains)
      }
    })()
  }
}
