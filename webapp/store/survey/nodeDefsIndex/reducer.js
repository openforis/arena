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
  [NodeDefsActions.nodeDefUpdate]: (state, { nodeDef, prevNodeDef = null }) =>
    Survey.updateNodeDefUuidByNameIndex({
      nodeDefsIndex: state,
      nodeDef,
      nodeDefPrevious: prevNodeDef,
    }),

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, nodeDefOriginal, isNodeDefNew }) =>
    isNodeDefNew
      ? Survey.deleteNodeDefIndex({ nodeDefsIndex: state, nodeDef })
      : // restore node defs index using the original node def name
        Survey.updateNodeDefUuidByNameIndex({
          nodeDefsIndex: state,
          nodeDef: nodeDefOriginal,
          nodeDefPrevious: nodeDef,
        }),
}

export default exportReducer(actionHandlers)
