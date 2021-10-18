import { useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { useIsDesignerNodeDefRoute, useOnUpdate, useOnBrowserBack, useOnPageUnload } from '@webapp/components/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyId, useSurveyCycleKey, NodeDefsActions } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'

export const useNodeDefDetails = () => {
  const { nodeDefUuid } = useParams()

  const history = useHistory()
  const dispatch = useDispatch()

  const survey = useSurvey()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useOnBrowserBack({
    active: State.isDirty(state),
    onBack: useCallback(() => Actions.cancelEdits({ state }), [state]),
  })

  useOnPageUnload({ active: State.isDirty(state) })

  useEffect(() => {
    const loadNodeDef = async () => {
      // Editing a nodeDef
      if (nodeDefUuid) {
        let nodeDefSurvey = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

        if (NodeDef.isAnalysis(nodeDefSurvey) && !NodeDef.isTemporary(nodeDefSurvey)) {
          try {
            nodeDefSurvey = await API.fetchNodeDef({ surveyId, nodeDefUuid })
            dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefSurvey }))
          } catch (err) {
            history.goBack()
          }
        }
        const validation = Survey.getNodeDefValidation(nodeDefSurvey)(survey)
        setState(State.create({ nodeDef: nodeDefSurvey, validation }))
      }
    }
    loadNodeDef()
  }, [])

  useOnUpdate(() => {
    if (editingFromDesigner) {
      history.goBack()
    } else {
      history.push(appModuleUri(analysisModules.chains))
    }
  }, [surveyCycleKey])

  return {
    state,
    Actions,
    editingFromDesigner,
  }
}
