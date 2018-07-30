import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

import { surveyNewUpdate, } from './actions'

const actionHandlers = {

  [surveyNewUpdate]: assocActionProps,

}

export default exportReducer(actionHandlers)