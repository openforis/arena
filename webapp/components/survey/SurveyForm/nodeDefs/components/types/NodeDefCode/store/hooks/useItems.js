import { useMemo } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import { useItemsFilter } from '../../../useItemsFilter'
import { useSurvey } from '@webapp/store/survey'
import { useRecordParentCategoryItemUuid } from '@webapp/store/ui/record/hooks'

export const useItems = ({ nodeDef, parentNode, draft, edit, entryDataQuery }) => {
  const survey = useSurvey()

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const parentCategoryItemUuid = useRecordParentCategoryItemUuid({ nodeDef, parentNode })

  const itemsArray = useMemo(() => {
    if (levelIndex > 0 && !parentCategoryItemUuid) return []
    const itemsInLevel = Survey.getCategoryItemsInLevel({ categoryUuid, levelIndex })(survey)
    return levelIndex > 0
      ? itemsInLevel.filter((item) => parentCategoryItemUuid === CategoryItem.getParentUuid(item))
      : itemsInLevel
  }, [categoryUuid, levelIndex, parentCategoryItemUuid, survey])

  // const alwaysIncludeItemFunction = useCallback(
  //   () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
  //   [entryDataQuery]
  // )

  // return useItemsFilter({ survey, nodeDef, record, parentNode, items, alwaysIncludeItemFunction })

  return itemsArray
}
