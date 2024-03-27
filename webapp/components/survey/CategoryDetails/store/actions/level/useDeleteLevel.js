import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as Survey from '@core/survey/survey'

import { SurveyActions, useSurvey } from '@webapp/store/survey'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import { State } from '../../state'

const _deleteLevel = async ({ surveyId, categoryUuid, level, setState, dispatch }) => {
  const levelUuid = CategoryLevel.getUuid(level)
  const levelIndex = CategoryLevel.getIndex(level)
  // Delete level and items from db
  const { data: categoryUpdated } = await axios.delete(
    `/api/survey/${surveyId}/categories/${categoryUuid}/levels/${levelUuid}`
  )
  await setState(
    A.pipe(
      State.dissocItemActive({ levelIndex }),
      State.dissocItems({ levelIndex }),
      State.assocCategory(categoryUpdated)
    )
  )

  dispatch(SurveyActions.surveyCategoryUpdated(categoryUpdated))
  dispatch(SurveyActions.metaUpdated())
}

const _checkCanBeDeleted = ({ survey, categoryUuid, level, dispatch }) => {
  const levelIndex = CategoryLevel.getIndex(level)
  const nodeDefsCode = Survey.getNodeDefsByCategoryUuid(categoryUuid)(survey)
  const usedByNodeDefs = nodeDefsCode.some((def) => Survey.getNodeDefCategoryLevelIndex(def)(survey) >= levelIndex)
  if (usedByNodeDefs) {
    dispatch(NotificationActions.notifyInfo({ key: 'categoryEdit.cantBeDeletedLevel' }))
    return false
  }
  return true
}

export const useDeleteLevel = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSurvey()

  return useCallback(
    async ({ category, level }) => {
      const categoryUuid = Category.getUuid(category)
      if (_checkCanBeDeleted({ survey, categoryUuid, level, dispatch })) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'categoryEdit.confirmDeleteLevel',
            params: { levelName: CategoryLevel.getName(level) },
            onOk: async () =>
              _deleteLevel({
                surveyId: Survey.getId(survey),
                categoryUuid,
                level,
                setState,
                dispatch,
              }),
          })
        )
      }
    },
    [survey]
  )
}
