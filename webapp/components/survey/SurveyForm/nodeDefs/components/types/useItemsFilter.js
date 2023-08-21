import { useMemo } from 'react'

import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

export const useItemsFilter = ({ survey, nodeDef, record, parentNode, items, alwaysIncludeItemFunction = null }) => {
  const itemsFilter = NodeDef.getItemsFilter(nodeDef)

  return useMemo(() => {
    const itemsArray = Object.values(items || {})
    if (itemsArray.length === 0 || Objects.isEmpty(itemsFilter)) return itemsArray

    return itemsArray.filter((item) => {
      if (alwaysIncludeItemFunction?.(item)) return true

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
  }, [items, itemsFilter, alwaysIncludeItemFunction, parentNode, record, survey])
}
