import { useCallback } from 'react'
import axios from 'axios'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import * as ChainController from '@common/analysis/chainController'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useDelete = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const deleteStep = ({ state }) => async () => {
    const chain = State.getChainEdit(state)
    const step = State.getStepEdit(state)
    const stepUuid = Step.getUuid(step)

    if (chainUuid && !Step.isTemporary(step)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${stepUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    const chainUpdated = ChainController.dissocStep({ chain, step })

    setState(
      A.pipe(
        State.assocChain(chainUpdated),
        State.assocChainEdit(chainUpdated),
        State.dissocStep,
        State.dissocStepEdit
      )(state)
    )

    dispatch(NotificationActions.notifyInfo({ key: 'processingStepView.deleteComplete' }))
  }

  return useCallback(async ({ state }) => {
    const stepDirty = State.isStepDirty(state)
    if (stepDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingStepView.deleteConfirm',
          onOk: deleteStep({ state }),
        })
      )
    } else {
      await deleteStep({ state })()
    }
  }, [])
}
