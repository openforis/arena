import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import * as SurveyState from '@webapp/store/survey/state'

import { NodeDefsActions } from '@webapp/store/survey'
import { State } from '../state'

export const useValidate = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)

  return useCallback(async ({ nodeDefUpdated }) => {
    const surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefUpdated })(survey)

    // Update local state immediately (see issue #3240)
    let dirty = false
    setState((statePrev) => {
      const stateNext = State.assocNodeDef(nodeDefUpdated)(statePrev)
      dirty = State.isDirty(stateNext)
      return stateNext
    })

    // // Dispatch update action
    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated, dirty }))

    // // Validate node def
    const validation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDefUpdated)
    setState(State.assocValidation(validation))
  }, [])
}
