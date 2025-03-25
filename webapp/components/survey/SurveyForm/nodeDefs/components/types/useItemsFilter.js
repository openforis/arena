import { useSelector } from 'react-redux'

import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { RecordState } from '@webapp/store/ui/record'
import { SurveyState } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

export const useItemsFilter = ({ nodeDef, parentNode, items, alwaysIncludeItemFunction = null }) => {
  const user = useUser()
  return useSelector((state) => {
    const itemsFilter = NodeDef.getItemsFilter(nodeDef)

    if (!Array.isArray(items) || items.length === 0 || Objects.isEmpty(itemsFilter)) return items

    const surveyInState = SurveyState.getSurvey(state)

    // convert survey in state into the format used in arena-core
    const survey = { ...Survey.getSurveyInfo(surveyInState), ...surveyInState }

    const record = RecordState.getRecord(state)

    const expressionEvaluator = new RecordExpressionEvaluator()

    return items.filter((item) => {
      if (alwaysIncludeItemFunction?.(item)) return true

      try {
        return expressionEvaluator.evalExpression({ user, survey, record, node: parentNode, query: itemsFilter, item })
      } catch (error) {
        // TODO throw error?
        return false
      }
    })
  }, Objects.isEqual)
}
