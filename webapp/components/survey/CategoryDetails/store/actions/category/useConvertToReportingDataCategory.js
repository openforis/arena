import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useInit } from './useInit'

export const useConvertToReportingDataCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const init = useInit({ setState })

  return useCallback(async ({ categoryUuid, onCategoryUpdate }) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.convertToReportingDataCategory.confirmMessage',
        onOk: async () => {
          await API.convertToReportingDataCategory({ surveyId, categoryUuid })
          // reset state
          init({ categoryUuid, onCategoryUpdate })
        },
      })
    )
  }, [])
}
