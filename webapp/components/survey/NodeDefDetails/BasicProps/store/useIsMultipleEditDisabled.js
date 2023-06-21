import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useIsMultipleEditDisabled = ({ nodeDef }) => {
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyCycleKey = useSurveyCycleKey()

  return (
    !nodeDef ||
    (NodeDef.isPublished(nodeDef) && !Survey.isTemplate(surveyInfo)) ||
    NodeDef.isKey(nodeDef) ||
    NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef) ||
    Survey.isNodeDefParentCode(nodeDef)(survey) ||
    NodeDef.isReadOnly(nodeDef) ||
    NodeDef.isAnalysis(nodeDef)
  )
}
