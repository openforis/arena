import { useCallback, useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'

import { useItemsFilter } from '../../../useItemsFilter'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useRecordParentCategoryItemUuid } from '@webapp/store/ui/record/hooks'
import * as API from '@webapp/service/api'

export const useItems = ({ nodeDef, parentNode, draft, edit, entryDataQuery }) => {
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  const itemsCount = Category.getItemsCount(category)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = useRecordParentCategoryItemUuid({ nodeDef, parentNode })

  const items = useMemo(() => {
    if (edit || (levelIndex > 0 && !parentCategoryItemUuid)) return []
    if (itemsCount > Category.maxCategoryItemsInIndex) {
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
    const itemsInLevel = Survey.getCategoryItemsInLevel({ categoryUuid, levelIndex })(survey)
    return levelIndex > 0
      ? itemsInLevel.filter((item) => parentCategoryItemUuid === CategoryItem.getParentUuid(item))
      : itemsInLevel
  }, [categoryUuid, draft, edit, itemsCount, lang, levelIndex, parentCategoryItemUuid, survey])

  const alwaysIncludeItemFunction = useCallback(
    () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
    [entryDataQuery]
  )

  return useItemsFilter({ nodeDef, parentNode, items, alwaysIncludeItemFunction })
}
