import { useCallback, useEffect, useMemo, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecordParentCategoryItemUuid } from '@webapp/store/ui/record/hooks'

import { useItemsFilter } from '../../../useItemsFilter'

const minItemsForAutocomplete = 100

const canHaveItems = ({ edit, levelIndex, parentCategoryItemUuid }) =>
  !edit && (levelIndex === 0 || parentCategoryItemUuid)

const hasItemsInSurveyIndex = ({ edit, levelIndex, parentCategoryItemUuid, itemsCount }) =>
  canHaveItems({ edit, levelIndex, parentCategoryItemUuid }) && itemsCount <= Category.maxCategoryItemsInIndex

const getItemsFromSurveyIndex = (params) => {
  if (!hasItemsInSurveyIndex(params)) {
    return []
  }
  const { categoryUuid, levelIndex, parentCategoryItemUuid, survey } = params
  const itemsInLevel = Survey.getCategoryItemsInLevel({ categoryUuid, levelIndex })(survey)
  return levelIndex > 0
    ? itemsInLevel.filter((item) => parentCategoryItemUuid === CategoryItem.getParentUuid(item))
    : itemsInLevel
}

const calculateItems = async (params) => {
  if (!canHaveItems(params)) {
    return []
  }
  if (hasItemsInSurveyIndex(params)) {
    return getItemsFromSurveyIndex(params)
  }
  const { categoryUuid, draft, itemsCount, lang, parentCategoryItemUuid, survey } = params
  const surveyId = Survey.getId(survey)

  const itemsFetchParams = { categoryUuid, draft, lang, parentUuid: parentCategoryItemUuid, surveyId }
  const availableItemsCount = await API.countCategoryItems(itemsFetchParams)

  if (availableItemsCount <= minItemsForAutocomplete) {
    const {
      data: { items },
    } = await API.fetchCategoryItems(itemsFetchParams).request
    return Object.values(items)
  }
  return itemsCount > Category.maxCategoryItemsInIndex
    ? // items taken with a lookup function
      (search) => API.fetchCategoryItems({ ...itemsFetchParams, search }).request
    : []
}

export const useItems = ({ nodeDef, parentNode, draft, edit, entryDataQuery }) => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  const itemsCount = Category.getItemsCount(category)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = useRecordParentCategoryItemUuid({ nodeDef, parentNode })

  const itemsGetParams = useMemo(
    () => ({
      categoryUuid,
      draft,
      edit,
      itemsCount,
      lang,
      levelIndex,
      parentCategoryItemUuid,
      survey,
    }),
    [categoryUuid, draft, edit, itemsCount, lang, levelIndex, parentCategoryItemUuid, survey]
  )

  const [items, setItems] = useState(getItemsFromSurveyIndex(itemsGetParams))

  useEffect(() => {
    calculateItems(itemsGetParams).then((_items) => {
      setItems(() => _items) // use a callback to prevent invoking items callback (when it's a function)
    })
  }, [itemsGetParams])

  const alwaysIncludeItemFunction = useCallback(
    () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
    [entryDataQuery]
  )

  return useItemsFilter({ nodeDef, parentNode, items, alwaysIncludeItemFunction })
}
