import * as R from 'ramda'

import {
  exportReducer,
  excludePathRoot
} from '../app-utils/reduxUtils'

import {
  actionTypes,
  statePaths
} from './surveyDashboard'

const actionHandlers = {
  [actionTypes.surveyLoaded]: (state, action) =>
    R.assocPath(excludePathRoot(statePaths.survey), action.survey, state)
}

export default exportReducer(actionHandlers)