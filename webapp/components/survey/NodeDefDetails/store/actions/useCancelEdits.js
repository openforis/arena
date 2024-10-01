import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { NodeDefsActions } from '@webapp/store/survey'
import { useIsEditingNodeDefInFullScreen } from '@webapp/store/ui/surveyForm'

import { State } from '../state'

export const useCancelEdits = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()

  const cancelEdits =
    ({ state }) =>
    async () => {
      const nodeDef = State.getNodeDef(state)
      const nodeDefOriginal = State.getNodeDefOriginal(state)

      if (editingNodeDefInFullScreen) {
        await setState(State.reset)
      } else {
        setState((statePrev) => State.create({ nodeDef: nodeDefOriginal, validation: State.getValidation(statePrev) }))
      }

      await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))
    }

  return useCallback(
    async ({ state, onCancel = null }) =>
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
          _cancel()
        }
      }),
    [editingNodeDefInFullScreen]
  )
}
