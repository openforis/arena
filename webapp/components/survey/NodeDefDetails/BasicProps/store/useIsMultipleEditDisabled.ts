import { isMultipleEditDisabled } from '@core/survey/nodeDefEditGuards'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

export const useIsMultipleEditDisabled = ({ nodeDef }) => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

  return isMultipleEditDisabled({ survey, nodeDef, cycle })
}
