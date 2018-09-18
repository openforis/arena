import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

/**
 * survey state
 */
import {
  assocNodeDefs,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefValidation,
  assocSurveyCodeLists,
  assocSurveyCodeListLevel,
  assocSurveyCodeListItem,
} from '../../common/survey/survey'

import {
  assocFormNodeDefEdit,
  assocNodeDefFormUnlocked,
  assocFormActivePage,
  assocFormPageNode,
  dissocForm,
} from './surveyState'

/**
 * record state
 */
import {
  //record
  assocNodes,
  deleteNode,
} from './record/recordState'

/**
 * code lists editor
 */
import {
  assocCodeListsEditorEditedCodeList,
  assocCodeListsEditorSelectedItemInLevel,
  dissocCodeListsEditorSelectedItemInLevel,
} from './codeList/codeListsEditorState'

/**
 * survey actions
 */
import {
  surveyCurrentUpdate,
  surveyNewUpdate,
} from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefValidationUpdate,

  //survey-form
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formActivePageNodeDefUpdate, formPageNodeUpdate, formReset,
} from './nodeDef/actions'

/**
 * record actions
 */
import {
  recordUpdate,
  nodesUpdate,
  nodeDelete,
} from './record/actions'

/**
 * code list actions
 */
import {
  codeListItemUpdate,
  codeListLevelUpdate,
  codeListsUpdate,
  codeListsEditorEditedCodeListUpdate,
  codeListsEditorItemSelect,
  codeListsEditorItemReset,
} from './codeList/actions'

const actionHandlers = {
  //SURVEY
  [surveyNewUpdate]: assocActionProps,

  [surveyCurrentUpdate]: (state, {survey}) => survey,

  // NODE-DEFS
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, validation}) => assocNodeDefValidation(nodeDefUUID, validation)(state),

  //SURVEY-FORM
  [formReset]: dissocForm,

  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) => assocFormActivePage(nodeDef)(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),

  //RECORD
  [recordUpdate]: assocActionProps,

  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),

  [nodeDelete]: (state, {node}) => deleteNode(node)(state),

  //CODE LIST
  [codeListsUpdate]: (state, {codeLists}) => assocSurveyCodeLists(codeLists)(state),

  [codeListLevelUpdate]: (state, {level}) => assocSurveyCodeListLevel(level)(state),

  [codeListItemUpdate]: (state, {codeListUUID, item}) => assocSurveyCodeListItem(codeListUUID, item)(state),

  [codeListsEditorEditedCodeListUpdate]: (state, {codeList}) => assocCodeListsEditorEditedCodeList(codeList)(state),

  [codeListsEditorItemSelect]: (state, {level, item}) => assocCodeListsEditorSelectedItemInLevel(level, item)(state),

  [codeListsEditorItemReset]: (state, {level}) => dissocCodeListsEditorSelectedItemInLevel(level)(state),
}

export default exportReducer(actionHandlers)