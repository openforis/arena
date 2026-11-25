import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { useAppDispatch } from '@webapp/store'
import { NodeDefsActions } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useIsEditingNodeDefInFullScreen } from '@webapp/store/ui/surveyForm'
import { State } from '../state'

export const useCancelEdits = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()

  const cancelEdits =
    ({ state }) =>
    (): Promise<void> => {
      const nodeDef = State.getNodeDef(state)
      const nodeDefOriginal = State.getNodeDefOriginal(state)

      if (editingNodeDefInFullScreen) {
        setState(State.reset)
      } else {
        setState((statePrev) => State.create({ nodeDef: nodeDefOriginal, validation: State.getValidation(statePrev) }))
      }

      dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))
      return Promise.resolve()
    }

  return useCallback(
    ({ state, onCancel = null }) =>
      new Promise((resolve, reject) => {
        const _cancel = () =>
          cancelEdits({ state })()
            .then(() => {
              if (onCancel) {
                onCancel({ state })
              } else if (editingNodeDefInFullScreen) {
                // go back by default
                navigate(-1)
              }
              resolve(true)
            })
            .catch(reject)

        if (State.isDirty(state)) {
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'common.cancelConfirm',
              onOk: _cancel,
              onCancel: () => resolve(false),
            })
          )
        } else {
          void _cancel()
        }
      }),
    [editingNodeDefInFullScreen]
  )
}
