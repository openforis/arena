import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import { useAppDispatch } from '@webapp/store'
import { NodeDefsActions } from '@webapp/store/survey'
import * as SurveyState from '@webapp/store/survey/state'
import { State } from '../state'

export const useValidate = ({ setState }) => {
  const dispatch = useAppDispatch()
  const survey = useSelector(SurveyState.getSurvey)

  return useCallback(
    async ({ nodeDef, nodeDefUpdated }) => {
      const surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefUpdated })(survey)

      // Update local state immediately (see issue #3240)
      let dirty = false
      setState((statePrev) => {
        const stateNext = State.assocNodeDef(nodeDefUpdated)(statePrev)
        dirty = State.isDirty(stateNext)
        return stateNext
      })

      // // Dispatch update action
      dispatch(NodeDefsActions.updateNodeDef({ prevNodeDef: nodeDef, nodeDef: nodeDefUpdated, dirty }))

      // // Validate node def
      const validation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDefUpdated)
      setState(State.assocValidation(validation))
    },
    [dispatch, setState, survey]
  )
}
