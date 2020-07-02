import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurveyCycleKey } from '@webapp/store/survey'

export const useIsDisplayInParentPageDisabled = ({ nodeDef }) => {
  const surveyCycleKey = useSurveyCycleKey()
  return NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
}
