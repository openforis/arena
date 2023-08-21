import { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as API from '@webapp/service/api'

import { useRequest } from '@webapp/components/hooks'
import { useItemsFilter } from '../../../useItemsFilter'

export const useItems = ({ survey, record, nodeDef, parentNode, draft, edit, entryDataQuery }) => {
  const surveyId = Survey.getId(survey)
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const parentCategoryItemUuid = Node.getCategoryItemUuid(nodeParentCode)

  const { items } = useRequest({
    condition: !edit && categoryUuid && (parentCategoryItemUuid || categoryLevelIndex === 0),
    defaultValue: { items: [] },
    dependencies: [edit, categoryUuid, categoryLevelIndex, parentCategoryItemUuid],
    requestFunction: API.fetchCategoryItems,
    requestArguments: [{ surveyId, categoryUuid, draft, parentUuid: parentCategoryItemUuid }],
  })

  const alwaysIncludeItemFunction = useCallback(
    () => entryDataQuery, // do not filter items when editing records from Data Explorer (entryDataQuery=true; record object is incomplete)
    [entryDataQuery]
  )

  return useItemsFilter({ survey, nodeDef, record, parentNode, items, alwaysIncludeItemFunction })
}
