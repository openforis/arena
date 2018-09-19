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
  assocCodeListEditorListUUID,
  assocCodeListEditorLevel,
  assocCodeListEditorItem,
  assocCodeListEditorActiveLevelItem,
  assocCodeListEditorLevelItems,
  dissocCodeListEditorActiveLevelItem,
  dissocCodeListEditorList,
  dissocCodeListEditorLevel,
  dissocCodeListEditorItem,
} from './codeList/codeListEditorState'

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
  codeListEditorItemUpdate,
  codeListEditorLevelUpdate,
  codeListsUpdate,
  codeListEditorCodeListUpdate,
  codeListEditorItemSelect,
  codeListEditorItemReset,
  codeListEditorLevelItemsUpdate,
  codeListEditorListDelete,
  codeListEditorLevelDelete,
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

  [codeListEditorCodeListUpdate]: (state, {codeListUUID}) => assocCodeListEditorListUUID(codeListUUID)(state),

  [codeListEditorLevelUpdate]: (state, {level}) => assocCodeListEditorLevel(level)(state),

  [codeListEditorItemSelect]: (state, {levelIndex, itemUUID}) => assocCodeListEditorActiveLevelItem(levelIndex, itemUUID)(state),

  [codeListEditorItemUpdate]: (state, {item}) => assocCodeListEditorItem(item)(state),

  [codeListEditorItemReset]: (state, {levelIndex}) => dissocCodeListEditorActiveLevelItem(levelIndex)(state),

  [codeListEditorLevelItemsUpdate]: (state, {levelIndex, items}) => assocCodeListEditorLevelItems(levelIndex, items)(state),

  [codeListEditorListDelete]: (state, {codeListUUID}) => dissocCodeListEditorList(codeListUUID)(state),

  [codeListEditorLevelDelete]: (state, {levelIndex}) => dissocCodeListEditorLevel(levelIndex)(state),
}

export default exportReducer(actionHandlers)