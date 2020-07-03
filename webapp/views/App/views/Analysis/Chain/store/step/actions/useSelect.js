import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useSelect = ({ chainState, ChainState, state, setState, State }) => {
  const dispatch = useDispatch()

  const { step, stepDirty } = State.get(state)

  const reset = useReset({
    chainState,
    ChainState,
    state,
    setState,
    State,
  })

  const select = ({ stepSelected }) => {
    setState({
      step: stepSelected,
      stepOriginal: stepSelected,
    })
  }

  const selectWithReset = ({ stepSelected }) => () => {
    reset()
    select({ stepSelected })
  }

  return (stepSelected) => {
    ;(async () => {
      if (stepDirty && !A.isEmpty(step)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: selectWithReset({ stepSelected }),
          })
        )
      } else {
        select({ stepSelected })
      }
    })()
  }
}
