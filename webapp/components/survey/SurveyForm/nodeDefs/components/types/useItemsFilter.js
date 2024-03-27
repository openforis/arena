import { useSelector } from 'react-redux'

import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

export const useItemsFilter = ({ nodeDef, parentNode, items, alwaysIncludeItemFunction = null }) =>
  useSelector((state) => {
    const itemsFilter = NodeDef.getItemsFilter(nodeDef)

    if (items.length === 0 || Objects.isEmpty(itemsFilter)) return items

    const survey = SurveyState.getSurvey(state)
    const record = RecordState.getRecord(state)

    const expressionEvaluator = new RecordExpressionEvaluator()

    if (!Array.isArray(items)) return []

    return items.filter((item) => {
      if (alwaysIncludeItemFunction?.(item)) return true

      try {
        return expressionEvaluator.evalExpression({
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
  }, Objects.isEqual)
