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
  [SurveyActions.surveyDefsIndexUpdate]: (_state, { nodeDefs }) => Survey.initNodeDefsIndex({ nodeDefs }),

  [NodeDefsActions.nodeDefCreate]: (state, { nodeDef }) => Survey.addNodeDefToIndex({ nodeDefsIndex: state, nodeDef }),
  [NodeDefsActions.nodeDefDelete]: (state, { nodeDef }) => Survey.deleteNodeDefIndex({ nodeDefsIndex: state, nodeDef }),
  [NodeDefsActions.nodeDefUpdate]: (state, { nodeDef, prevNodeDef = null }) => {
    let stateUpdated = state
    if (prevNodeDef) {
      stateUpdated = Survey.deleteNodeDefIndex({ nodeDefsIndex: stateUpdated, nodeDef: prevNodeDef })
    }
    stateUpdated = Survey.addNodeDefToIndex({ nodeDefsIndex: stateUpdated, nodeDef })
    return stateUpdated
  },

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, nodeDefOriginal, isNodeDefNew }) => {
    let stateUpdated = Survey.deleteNodeDefIndex({ nodeDefsIndex: state, nodeDef })
    if (isNodeDefNew) {
      return stateUpdated
    }
    stateUpdated = Survey.addNodeDefToIndex({ nodeDefsIndex: stateUpdated, nodeDef: nodeDefOriginal })
    return stateUpdated
  },
}

export default exportReducer(actionHandlers)
