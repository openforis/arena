import axios from 'axios'

import * as TableViewsState from './tableViewsState'
import * as SurveyState from '../../survey/surveyState'

export const tableViewsModuleActiveUpdate = 'tableViews/moduleActive/update'
export const tableViewsListUpdate = 'tableViews/list/update'

const getItems = (surveyId, module, offset, limit) => axios.get(
  `/api/survey/${surveyId}/${module}`,
  { params: { offset, limit } }
)

export const initList = module => async (dispatch, getState) => {
  dispatch({ type: tableViewsModuleActiveUpdate, module })

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const offset = TableViewsState.getOffset(module)(state)
  const limit = TableViewsState.getLimit(module)(state)

  const [countResp, itemsResp] = await Promise.all([
    axios.get(`/api/survey/${surveyId}/${module}/count`),
    getItems(surveyId, module, offset, limit)
  ])

  dispatch({
    type: tableViewsListUpdate,
    offset,
    limit,
    ...countResp.data,
    ...itemsResp.data,
  })
}

export const fetchListItems = offset => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const module = TableViewsState.getModuleActive(state)
  const limit = TableViewsState.getLimit(module)(state)

  const { data } = await getItems(surveyId, module, offset, limit)

  dispatch({
    type: tableViewsListUpdate,
    offset,
    ...data,
  })

}
