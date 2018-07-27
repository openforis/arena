import {
  exportReducer,
  assocActionProps,
} from '../app-utils/reduxUtils'

import { newSurveyUpdate } from './actions'

const actionHandlers = {

  [newSurveyUpdate]: assocActionProps,

}

export default exportReducer(actionHandlers)