import { isMaxKeysCountReached } from '@core/survey/nodeDefEditGuards'

import { useSurvey } from '@webapp/store/survey'

export const useIsMaxKeysCountReached = ({ nodeDef }: { nodeDef: any }): boolean => {
  const survey = useSurvey()

  return isMaxKeysCountReached({ survey, nodeDef })
}
