import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Chain from '@common/analysis/processingChain'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { State } from '../../state'

export const useDelete = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()

  const resetChain = ({ state }) => async () => {
    const chain = State.getChainEdit(state)
    const chainUuid = Chain.getUuid(chain)
    if (chainUuid) {
      await axios.delete(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }
    dispatch(NotificationActions.notifyInfo({ key: 'processingChainView.deleteComplete' }))
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return useCallback(({ state }) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'processingChainView.deleteConfirm',
        onOk: resetChain({ state }),
      })
    )
  }, [])
}
