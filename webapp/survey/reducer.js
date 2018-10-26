import { assocActionProps, exportReducer, } from '../appUtils/reduxUtils'

/**
 * survey state
 */
import {
  assocNodeDefs,
  assocNodeDef,
  assocNodeDefProp,
  assocNodeDefValidation,
  dissocNodeDef,

  assocSurveyCodeLists,
  assocSurveyTaxonomies,
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
 * code lists state
 */
import {
  updateCodeListEdit,
  assocCodeListEditActiveLevelItem,
  assocCodeListEditLevelItems,
  dissocCodeListEditLevelItems,
} from './codeList/codeListEditState'

/**
 * taxonomy state
 */
import {
  updateTaxonomyEdit,
} from './taxonomy/taxonomyEditState'

/**
 * survey actions
 */
import {
  surveyCurrentUpdate,
} from './actions'
/**
 * nodeDef Actions
 */
import {
  nodeDefPropUpdate,
  nodeDefsUpdate,
  nodeDefUpdate,
  nodeDefValidationUpdate,
  nodeDefDelete,

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
  codeListsUpdate,
  codeListEditUpdate,
  codeListEditLevelItemsUpdate,
  codeListEditActiveLevelItemUpdate,
} from './codeList/actions'

/**
 * taxonomy actions
 */
import {
  taxonomiesUpdate,
  taxonomyEditUpdate,
} from './taxonomy/actions'

const actionHandlers = {
  //SURVEY
  [surveyCurrentUpdate]: (state, {survey}) => survey,

  // NODE-DEFS
  [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),

  [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),

  [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),

  [nodeDefValidationUpdate]: (state, {nodeDefUUID, validation}) => assocNodeDefValidation(nodeDefUUID, validation)(state),

  [nodeDefDelete]: (state, {nodeDef}) => dissocNodeDef(nodeDef)(state),

  //SURVEY-FORM
  [formReset]: dissocForm,

  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) => assocFormActivePage(nodeDef)(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),

  //CODE LIST
  [codeListsUpdate]: (state, {codeLists}) => assocSurveyCodeLists(codeLists)(state),

  [codeListEditUpdate]: (state, {codeListUUID}) => updateCodeListEdit(codeListUUID)(state),

  [codeListEditActiveLevelItemUpdate]: (state, {levelIndex, itemUUID}) => assocCodeListEditActiveLevelItem(levelIndex, itemUUID)(state),

  [codeListEditLevelItemsUpdate]: (state, {levelIndex, items}) =>
    items === null
      ? dissocCodeListEditLevelItems(levelIndex)(state)
      : assocCodeListEditLevelItems(levelIndex, items)(state),

  //TAXONOMY
  [taxonomiesUpdate]: (state, {taxonomies}) => assocSurveyTaxonomies(taxonomies)(state),

  [taxonomyEditUpdate]: (state, {type, ...otherProps}) => updateTaxonomyEdit(otherProps)(state),

  //RECORD
  [recordUpdate]: assocActionProps,

  [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),

  [nodeDelete]: (state, {node}) => deleteNode(node)(state),

}

export default exportReducer(actionHandlers)