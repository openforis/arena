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
  [SurveyActions.surveyDefsIndexUpdate]: (state) => {
    console.log(state)
  },

  [NodeDefsActions.nodeDefCreate]: (state, { nodeDef }) => Survey.addNodeDefToIndex({ nodeDefsIndex: state, nodeDef }),
  [NodeDefsActions.nodeDefDelete]: (state, { nodeDef }) => Survey.deleteNodeDefIndex({ nodeDefsIndex: state, nodeDef }),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, isNodeDefNew }) =>
    isNodeDefNew
      ? Survey.deleteNodeDefIndex({ nodeDefsIndex: state, nodeDef }) // Remove node def from state
      : state,
}

export default exportReducer(actionHandlers)
