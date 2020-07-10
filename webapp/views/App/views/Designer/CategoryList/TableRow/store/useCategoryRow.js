import { useState, useEffect } from 'react'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'

export const useCategoryRow = (props) => {
  const { canSelect, idx, inCategoriesPath, initData, offset, onSelect, row: category, selectedItemUuid } = props

  const survey = useSurvey()
  const unused = A.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))
  const position = idx + offset + 1

  const [state, setState] = useState(() =>
    State.create({ canSelect, category, inCategoriesPath, initData, onSelect, position, selectedItemUuid, unused })
  )

  useEffect(() => {
    setState((prevState) => State.assocSelectedItemUuid(selectedItemUuid)(prevState))
  }, [selectedItemUuid])

  const Actions = useActions()

  return { state, Actions }
}
