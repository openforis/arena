import type { ArenaSurvey } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { SystemActionTypes } from '@webapp/store/system/actionTypes'
import { exportReducer } from '@webapp/utils/reduxUtils'
import * as SurveyActions from '../actions'
import { NodeDefsActions } from '../nodeDefs'

const actionHandlers = {
  // Reset state
  [SystemActionTypes.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyActions.surveyDefsReset]: () => ({}),

  // NodeDefs load
  // only the node defs are used to build the index
  [SurveyActions.surveyDefsLoad]: (_state, { nodeDefs }) => Survey.initNodeDefsIndex({ nodeDefs } as ArenaSurvey),
  [SurveyActions.surveyDefsIndexUpdate]: (_state, { nodeDefs }) =>
    Survey.initNodeDefsIndex({ nodeDefs } as ArenaSurvey),

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
