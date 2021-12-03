import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { NodeDefsActions } from '@webapp/store/survey'

import { State } from '../state'

export const useCancelEdits = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const cancelEdits =
    ({ state }) =>
    async () => {
      const nodeDef = State.getNodeDef(state)
      const nodeDefOriginal = State.getNodeDefOriginal(state)

      await setState(State.reset)

      await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))

      navigate(-1)
    }

  return useCallback(
    async ({ state }) =>
      new Promise((resolve, reject) => {
        const _cancel = () =>
          cancelEdits({ state })()
            .then(() => resolve(true))
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
    []
  )
}
