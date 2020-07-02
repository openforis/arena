import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

import { SurveyActions, useSurveyId } from '@webapp/store/survey'

export const useDelete = ({ chain, setChain, step, stepDirty, setStep, setStepDirty }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const resetStep = async () => {
    const stepUuid = Step.getUuid(step)
    setStep(null)

    if (chainUuid && !Step.isTemporary(step)) {
      await axios.delete(`/api/survey/${surveyId}/processing-step/${stepUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }

    const newChain = Chain.dissocProcessingStep(step)(Chain.dissocProcessingStepTemporary(chain))

    setChain(newChain)
    setStepDirty(null)
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
