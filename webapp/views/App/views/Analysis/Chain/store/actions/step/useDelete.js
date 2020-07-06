import { useCallback } from 'react'
import axios from 'axios'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useDelete = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const deleteStep = ({ state }) => async () => {
    const stepToDelete = State.getStepEdit(state)
    const stepUuid = Step.getUuid(stepToDelete)

    if (chainUuid && !Step.isTemporary(stepToDelete)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${stepUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    const newChain = A.pipe(
      Chain.dissocProcessingStep(stepToDelete),
      Chain.dissocProcessingStepTemporary
    )(State.getChainEdit(State))

    setState(
      A.pipe(State.assocChain(newChain), State.assocChainEdit(newChain), State.dissocStep, State.dissocStepEdit)(state)
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
