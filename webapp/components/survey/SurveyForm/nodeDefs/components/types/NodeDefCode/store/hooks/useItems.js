import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as API from '@webapp/service/api'

import { useRequest } from '@webapp/components/hooks'
import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'
import { useMemo } from 'react'

export const useItems = ({ survey, record, nodeDef, parentNode, draft, edit }) => {
  const surveyId = Survey.getId(survey)
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const categoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)
  const nodeParentCode = Record.getParentCodeAttribute(survey, parentNode, nodeDef)(record)
  const parentCategoryItemUuid = Node.getCategoryItemUuid(nodeParentCode)
  const itemsFilter = NodeDef.getItemsFilter(nodeDef)

  const { items } = useRequest({
    condition: !edit && categoryUuid && (parentCategoryItemUuid || categoryLevelIndex === 0),
    defaultValue: { items: [] },
    dependencies: [edit, categoryUuid, categoryLevelIndex, parentCategoryItemUuid],
    requestFunction: API.fetchCategoryItems,
    requestArguments: [{ surveyId, categoryUuid, draft, parentUuid: parentCategoryItemUuid }],
  })

  const itemsArray = Object.values(items || {})

  return useMemo(() => {
    if (itemsArray.length > 0 && !Objects.isEmpty(itemsFilter)) {
      return itemsArray.filter((item) => {
        try {
          return new RecordExpressionEvaluator().evalExpression({
            survey,
            record,
            node: parentNode,
            query: itemsFilter,
            item,
          })
        } catch (error) {
          // TODO throw error?
          return false
        }
      })
    }

    return itemsArray
  }, [itemsArray, itemsFilter, parentNode, record, survey])
}
