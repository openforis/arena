import { useState } from 'react'
import { useSelector } from 'react-redux'

import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'
import { useUser } from '@webapp/store/user'

export const useItemsFilter = ({ nodeDef, parentNode, items, alwaysIncludeItemFunction = null }) => {
  const user = useUser()
  const [itemsFiltered, setItemsFiltered] = useState([])

  return useSelector((state) => {
    const itemsFilter = NodeDef.getItemsFilter(nodeDef)

    if (!Array.isArray(items) || items.length === 0 || Objects.isEmpty(itemsFilter)) return items

    const surveyInState = SurveyState.getSurvey(state)

    // convert survey in state into the format used in arena-core
    const survey = { ...Survey.getSurveyInfo(surveyInState), ...surveyInState }

    const record = RecordState.getRecord(state)

    const expressionEvaluator = new RecordExpressionEvaluator()

    Promise.all(
      items.map((item) => {
        if (alwaysIncludeItemFunction?.(item)) return true
        return expressionEvaluator.evalExpression({ user, survey, record, node: parentNode, query: itemsFilter, item })
      })
    ).then((itemsFilterResults) => {
      const _itemsFiltered = items.filter((_, index) => itemsFilterResults[index])
      if (!Objects.isEqual(itemsFiltered, _itemsFiltered)) {
        setItemsFiltered(_itemsFiltered)
      }
    })
    return itemsFiltered
  }, Objects.isEqual)
}
