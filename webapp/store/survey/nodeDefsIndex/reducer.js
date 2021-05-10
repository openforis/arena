import * as Survey from '@core/survey/survey'

import { exportReducer } from '@webapp/utils/reduxUtils'

import { SystemActions } from '@webapp/store/system'

import { NodeDefsActions } from '../nodeDefs'
import * as SurveyActions from '../actions'

const actionHandlers = {
  // Reset state
  [SystemActions.SYSTEM_RESET]: () => ({}),
  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefs load
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefs }) => Survey.initNodeDefsIndex({ nodeDefs }),
  [NodeDefsActions.nodeDefUpdate]: (nodeDefsIndex, { nodeDef }) => Survey.addNodeDefToIndex({ nodeDefsIndex, nodeDef }),
  [NodeDefsActions.nodeDefDelete]: (nodeDefsIndex, { nodeDef }) =>
    Survey.deleteNodeDefIndex({ nodeDefsIndex, nodeDefDeleted: nodeDef }),
}

export default exportReducer(actionHandlers)
