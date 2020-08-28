import { useEffect, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router'

import { useIsDesignerNodeDefRoute, useOnUpdate } from '@webapp/components/hooks'

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
  const stateRef = useRef(state)

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid && !State.getNodeDef(state)) {
      const nodeDefSurvey = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDefSurvey)(survey)
      setState(State.create({ nodeDef: nodeDefSurvey, validation }))
    }

    return () => {
      // get local state from stateRef to get it up to date in this callback
      if (State.isDirty(stateRef.current)) {
        Actions.cancelEdits({ state: stateRef.current, showConfirm: false, goBack: false })
      }
    }
  }, [])

  useEffect(() => {
    // update state ref on local state update
    stateRef.current = state
  }, [state])

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
