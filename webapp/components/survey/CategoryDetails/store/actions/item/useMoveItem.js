import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui'

import { State } from '../../state'

const sendUpdateIndexesRequest = async ({ dispatch, surveyId, categoryUuid, parentUuid, indexByUuid }) => {
  dispatch(LoaderActions.showLoader())

  await API.updateCategoryItemIndexes({ surveyId, categoryUuid, parentUuid, indexByUuid })

  dispatch(SurveyActions.metaUpdated())

  dispatch(LoaderActions.hideLoader())
}

const moveItemByOffset = ({ dispatch, state, surveyId, categoryUuid, levelIndex, itemUuid, offset }) => {
  const items = State.getItemsArray({ levelIndex })(state)
  const itemsIndexedByUuid = State.getItems({ levelIndex })(state)
  const itemPrev = itemsIndexedByUuid[itemUuid]
  const itemIndexPrev = CategoryItem.getIndex(itemPrev)
  const parentUuid = CategoryItem.getParentUuid(itemPrev)
  const itemIndexNext = itemIndexPrev + offset
  const itemToReplace = items[itemIndexNext]
  if (!itemToReplace) {
    // final index out of bounds
    return { stateUpdated: state, updated: false }
  }
  const itemToReplaceUuid = CategoryItem.getUuid(itemToReplace)

  const updatedIndexByUuid = {
    [itemUuid]: itemIndexNext,
    [itemToReplaceUuid]: itemIndexPrev,
  }

  let stateUpdated = state
  const indexPropKey = CategoryItem.keysProps.index
  for (const [uuid, index] of Object.entries(updatedIndexByUuid)) {
    stateUpdated = State.assocItemProp({ levelIndex, itemUuid: uuid, key: indexPropKey, value: index })(stateUpdated)
  }

  sendUpdateIndexesRequest({ dispatch, surveyId, categoryUuid, parentUuid, indexByUuid: updatedIndexByUuid })

  return { stateUpdated, updated: true }
}

export const useMoveItem = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(
    ({ setItem, category, level, item, offset }) => {
      const categoryUuid = Category.getUuid(category)
      const itemUuid = CategoryItem.getUuid(item)
      const levelIndex = CategoryLevel.getIndex(level)
      setState((statePrev) => {
        const { stateUpdated, updated } = moveItemByOffset({
          dispatch,
          state: statePrev,
          surveyId,
          categoryUuid,
          levelIndex,
          itemUuid,
          offset,
        })
        if (updated) {
          const itemUpdated = State.getItemActive({ levelIndex })(stateUpdated)
          setItem(itemUpdated)
        }
        return stateUpdated
      })
    },
    [dispatch, setState, surveyId]
  )
}
