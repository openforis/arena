import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey } from '@webapp/store/survey'

export const useIsKeyEditDisabled = ({ nodeDef }) => {
  const survey = useSurvey()
  return (
    !nodeDef ||
    NodeDef.isRoot(nodeDef) ||
    NodeDef.isMultiple(nodeDef) ||
    NodeDef.isAutoIncrementalKey(nodeDef) ||
    (!NodeDef.isKey(nodeDef) &&
      Survey.getNodeDefKeys(Survey.getNodeDefParent(nodeDef)(survey))(survey).length >= NodeDef.maxKeyAttributes)
  )
}
