import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useSurvey, useSurveyLang } from '@webapp/store/survey'
import { useNodeDefLabelType, useNodeDefPage } from '@webapp/store/ui/surveyForm'

export const usePath = () => {
  const survey = useSurvey()
  let nodeDefCurrent = useNodeDefPage()
  const lang = useSurveyLang()
  const labelType = useNodeDefLabelType()

  const labels = []
  while (nodeDefCurrent) {
    labels.unshift(NodeDef.getLabel(nodeDefCurrent, lang, labelType))
    nodeDefCurrent = Survey.getNodeDefParent(nodeDefCurrent)(survey)
  }
  return labels.join(' -> ')
}