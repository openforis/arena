import { useCallback, useEffect, useState } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import { useItemsFilter } from '../../../useItemsFilter'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecordParentCategoryItemUuid } from '@webapp/store/ui/record/hooks'
import * as API from '@webapp/service/api'
import { useMemo } from 'react'

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
  if (itemsCount > Category.maxCategoryItemsInIndex) {
    // items taken from a lookup function
    const surveyId = Survey.getId(survey)
    return (search) => {
      return API.fetchCategoryItems({
        surveyId,
        categoryUuid,
        draft,
        parentUuid: parentCategoryItemUuid,
        search,
        lang,
      }).request
    }
  }
  return []
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
    calculateItems(itemsGetParams).then((_items) => setItems(_items))
  }, [itemsGetParams])

  const alwaysIncludeItemFunction = useCallback(
    () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
    [entryDataQuery]
  )

  return useItemsFilter({ nodeDef, parentNode, items, alwaysIncludeItemFunction })
}
