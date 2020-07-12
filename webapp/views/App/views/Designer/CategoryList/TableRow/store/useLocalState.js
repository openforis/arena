import { useState } from 'react'

import * as A from '@core/arena'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import { State } from './state'

export const useLocalState = (props) => {
  const { idx, initData, listState, offset, row: category } = props

  const survey = useSurvey()
  const unused = A.isEmpty(Survey.getNodeDefsByCategoryUuid(Category.getUuid(category))(survey))
  const position = idx + offset + 1

  const newState = State.create({
    category,
    initData,
    listState,
    position,
    unused,
  })

  const [state, setState] = useState(newState)

  // TODO check why state.listState is different from newState.listState
  return { state: { ...state, ...newState }, setState }
}
