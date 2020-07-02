import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

export const useIsDisplayAsTableDisabled = ({ nodeDef }) => {
  const survey = useSurvey()
  return Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)
}
