import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import * as Survey from '@core/survey/survey'

import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { SurveyFormActions, useTreeSelectViewMode } from '@webapp/store/ui/surveyForm'

import { getNodeDefNavigation } from './changeSetCardModel'

/**
 * Returns a function that shows an item in the form designer (selected, or its page opened).
 * @returns {Function} Takes the item uuid; does nothing when the item doesn't exist (yet).
 */
export const useShowNodeDef = (): ((nodeDefUuid: string) => void) => {
  const dispatch = useDispatch<any>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const viewMode = useTreeSelectViewMode()

  return useCallback(
    (nodeDefUuid: string) => {
      const navigation = getNodeDefNavigation({ survey, nodeDefUuid, cycle, viewMode })
      if (!navigation) return
      if (navigation.type === 'select') {
        dispatch(SurveyFormActions.setFormActiveNodeDefUuid(navigation.nodeDefUuid))
      } else {
        dispatch(
          SurveyFormActions.setFormActivePage({ nodeDef: Survey.getNodeDefByUuid(navigation.pageNodeDefUuid)(survey) })
        )
      }
      const formDesignerUri = appModuleUri(designerModules.formDesigner)
      if (!pathname.startsWith(formDesignerUri)) navigate(formDesignerUri)
    },
    [cycle, dispatch, navigate, pathname, survey, viewMode]
  )
}
