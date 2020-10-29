import { useCallback } from 'react'

import * as StepVariable from '@common/analysis/stepVariable'

import { State } from '../../state'

export const useDismissEditor = ({ setState }) =>
  useCallback(() => {
    setState((statePrev) => {
      const variablePrev = State.getVariablePrevStepEdit(statePrev)

      let stateUpdated = State.dissocVariablePrevStepEdit(statePrev)

      if (variablePrev) {
        // highlight last edited variable when edit completes
        stateUpdated = State.assocVariablePrevStepUuidHighlighted(StepVariable.getUuid(variablePrev))(stateUpdated)
        // reset higlighted variable after 4 sec (animation duration)
        setTimeout(() => setState(State.dissocVariablePrevStepUuidHighlighted), 4000)

        return stateUpdated
      }
      return State.dissocVariablePrevStepUuidHighlighted(stateUpdated)
    })
  }, [])
