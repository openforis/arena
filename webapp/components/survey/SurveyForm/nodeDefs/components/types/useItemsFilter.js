import { useState } from 'react'
import { useSelector } from 'react-redux'

import { Objects, RecordExpressionEvaluator } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'
import { useUser } from '@webapp/store/user'

const filterItems = async ({
  user,
  survey: surveyInState,
  record,
  parentNode,
  items,
  alwaysIncludeItemFunction,
  itemsFilter,
}) => {
  const expressionEvaluator = new RecordExpressionEvaluator()
  // convert survey in state into the format used in arena-core
  const survey = { ...Survey.getSurveyInfo(surveyInState), ...surveyInState }
  const itemsFilterResults = []
  for (const item of items) {
    const itemFilterResult =
      alwaysIncludeItemFunction?.(item) ||
      (await expressionEvaluator.evalExpression({ user, survey, record, node: parentNode, query: itemsFilter, item }))
    itemsFilterResults.push(itemFilterResult)
  }
  return items.filter((_, index) => itemsFilterResults[index])
}

export const useItemsFilter = ({ nodeDef, parentNode, items, alwaysIncludeItemFunction = null }) => {
  const user = useUser()
  const [itemsFiltered, setItemsFiltered] = useState([])

  return useSelector((state) => {
    const itemsFilter = NodeDef.getItemsFilter(nodeDef)

    if (!Array.isArray(items) || items.length === 0 || Objects.isEmpty(itemsFilter)) return items

    const survey = SurveyState.getSurvey(state)

    const record = RecordState.getRecord(state)

    filterItems({
      user,
      survey,
      record,
      parentNode,
      items,
      alwaysIncludeItemFunction,
      itemsFilter,
    }).then((_itemsFiltered) => {
      if (!Objects.isEqual(itemsFiltered, _itemsFiltered)) {
        setItemsFiltered(_itemsFiltered)
      }
    })
    return itemsFiltered
  }, Objects.isEqual)
}
