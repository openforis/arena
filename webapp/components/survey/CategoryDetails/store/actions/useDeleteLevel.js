import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { NotificationActions, DialogConfirmActions } from '@webapp/store/ui'
import { useSurvey } from '@webapp/store/survey'

import { State } from '../state'

const _deleteLevel = async ({ surveyId, categoryUuid, levelUuid, setState }) => {
  // Delete level and items from db
  const { data: categoryUpdated } = await axios.delete(
    `/api/survey/${surveyId}/categories/${categoryUuid}/levels/${levelUuid}`
  )
  await setState(State.assocCategory(categoryUpdated))
}

export const useDeleteLevel = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  return useCallback(
    async ({ category, level }) => {
      setState((statePrev) => {
        const categoryUuid = Category.getUuid(category)
        const nodeDefsCode = Survey.getNodeDefsByCategoryUuid(categoryUuid)(survey)
        const usedByNodeDefs = nodeDefsCode.some(
          (def) => Survey.getNodeDefCategoryLevelIndex(def)(survey) >= CategoryLevel.getIndex(level)
        )

        if (usedByNodeDefs) {
          dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeletedLevel' }))
        } else {
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key: 'categoryEdit.confirmDeleteLevel',
              params: { levelName: CategoryLevel.getName(level) },
              onOk: async () =>
                _deleteLevel({
                  surveyId: Survey.getId(survey),
                  categoryUuid,
                  levelUuid: CategoryLevel.getUuid(level),
                  setState,
                }),
            })
          )
        }
        return statePrev
      })
    },
    [survey]
  )
}
