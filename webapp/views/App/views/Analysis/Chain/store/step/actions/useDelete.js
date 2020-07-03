import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'

export const useDelete = ({ chain, setChain, state, setState, State }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()
  const { step, stepDirty } = State.get(state)

  const resetStep = async () => {
    const stepUuid = Step.getUuid(step)

    if (chainUuid && !Step.isTemporary(step)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${stepUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    const newChain = Chain.dissocProcessingStep(step)(Chain.dissocProcessingStepTemporary(chain))

    setChain(newChain)

    setState({
      stepDirty: null,
      step: null,
    })
    dispatch(NotificationActions.notifyInfo({ key: 'processingStepView.deleteComplete' }))
  }

  return () => {
    ;(async () => {
      if (stepDirty) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepView.deleteConfirm',
            onOk: resetStep,
          })
        )
      } else {
        await resetStep()
      }
    })()
  }
}
