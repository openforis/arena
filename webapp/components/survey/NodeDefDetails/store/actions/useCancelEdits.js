import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { NodeDefsActions } from '@webapp/store/survey'

import { State } from '../state'

export const useCancelEdits = () => {
  const history = useHistory()
  const dispatch = useDispatch()

  const cancelEdits = ({ state, goBack }) => async () => {
    const nodeDef = State.getNodeDef(state)
    const nodeDefOriginal = State.getNodeDefOriginal(state)

    await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))

    if (goBack) {
      history.goBack()
    }
  }

  return useCallback(async ({ state, showConfirm = true, goBack = true }) => {
    const dirty = State.isDirty(state)
    if (dirty && showConfirm) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: cancelEdits({ state, goBack }),
        })
      )
    } else {
      await cancelEdits({ state, goBack })()
    }
  }, [])
}
