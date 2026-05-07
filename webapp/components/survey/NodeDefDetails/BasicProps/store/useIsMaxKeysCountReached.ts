import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

export const useIsMaxKeysCountReached = ({ nodeDef }: { nodeDef: any }): boolean => {
  const survey = useSurvey()

  if (!nodeDef) {
    return false
  }
  const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
  return parentDef && Survey.getNodeDefKeys(parentDef)(survey).length >= NodeDef.maxKeyAttributes
}
