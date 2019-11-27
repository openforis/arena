import {exportReducer} from '@webapp/utils/reduxUtils'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'
import {nodeDefCreate} from '@webapp/survey/nodeDefs/actions'
import {formReset} from '../surveyForm/actions'
import * as NodeDefEditState from './nodeDefEditState'

import {nodeDefEditUpdate} from './actions'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [nodeDefEditUpdate]: (state, {nodeDef}) => NodeDefEditState.assocNodeDef(nodeDef)(state),

  [nodeDefCreate]: (state, {nodeDef}) => NodeDefEditState.assocNodeDef(nodeDef)(state),
}

export default exportReducer(actionHandlers)
