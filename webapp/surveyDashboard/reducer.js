import {
  exportReducer,
  assocActionProps,
} from '../app-utils/reduxUtils'

import {
  actionTypes,
  statePaths
} from './surveyDashboard'

const actionHandlers = {

  [actionTypes.surveyLoaded]: assocActionProps

}

export default exportReducer(actionHandlers)