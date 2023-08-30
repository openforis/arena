import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useIsDesignerNodeDefRoute, useOnUpdate, useOnBrowserBack, useOnPageUnload } from '@webapp/components/hooks'

import * as Survey from '@core/survey/survey'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'

export const useNodeDefDetails = () => {
  const { nodeDefUuid } = useParams()

  const navigate = useNavigate()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useOnBrowserBack({
    active: State.isDirty(state),
    onBack: useCallback(() => Actions.cancelEdits({ state }), [state]),
  })

  useOnPageUnload({ active: State.isDirty(state) })

  // create initial state on mount
  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDef)(survey)
      setState(State.create({ nodeDef, validation }))
    }
  }, [nodeDefUuid])

  useOnUpdate(() => {
    if (editingFromDesigner) {
      navigate(-1)
    } else {
      navigate(appModuleUri(analysisModules.chains))
    }
  }, [surveyCycleKey])

  return {
    state,
    Actions,
    editingFromDesigner,
  }
}
