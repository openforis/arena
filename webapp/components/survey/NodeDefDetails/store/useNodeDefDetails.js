import { useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'

import { useIsDesignerNodeDefRoute, useOnUpdate, useIntersectBack } from '@webapp/components/hooks'

import * as Survey from '@core/survey/survey'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'

export const useNodeDefDetails = () => {
  const { nodeDefUuid } = useParams()

  const history = useHistory()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useIntersectBack({
    active: State.isDirty(state),
    onBack: useCallback(() => Actions.cancelEdits({ state }), [state]),
  })

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDefSurvey = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDefSurvey)(survey)
      setState(State.create({ nodeDef: nodeDefSurvey, validation }))
    }
  }, [])

  useOnUpdate(() => {
    if (editingFromDesigner) {
      history.goBack()
    } else {
      history.push(appModuleUri(analysisModules.processingChains))
    }
  }, [surveyCycleKey])

  return {
    state,
    Actions,
    editingFromDesigner,
  }
}
