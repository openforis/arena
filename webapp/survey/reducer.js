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

  assocCodeLists,
  assocSurveyTaxonomies,
} from '../../common/survey/survey'

import {
  dissocForm,
} from './form/surveyFormState'

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
  assocCodeListEdit,
  assocLevelActiveItem,
  assocLevelItems,
  dissocCodeListEditLevelItems,
} from './codeListEdit/codeListEditState'

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
  nodeDefDelete,

  //survey-form
  } from './nodeDefs/actions'

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
  } from './codeLists/actions'

/**
 * taxonomy actions
 */
import {
  taxonomiesUpdate,
  taxonomyEditUpdate,
} from './taxonomy/actions'
import {
  formActivePageNodeDefUpdate,
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formPageNodeUpdate,
  formReset
} from './form/actions'
import {
  assocFormActivePage,
  assocFormNodeDefEdit,
  assocFormPageNode,
  assocNodeDefFormUnlocked
} from './form/surveyFormState'
import {
  codeListEditLevelActiveItemUpdate,
  codeListEditLevelItemsUpdate,
  codeListEditUpdate
} from './codeListEdit/actions'

const actionHandlers = {
  //SURVEY
  // [surveyCurrentUpdate]: (state, {survey}) => survey,

  // NODE-DEFS
  // [nodeDefsUpdate]: (state, {nodeDefs}) => assocNodeDefs(nodeDefs)(state),
  //
  // [nodeDefUpdate]: (state, {nodeDef}) => assocNodeDef(nodeDef)(state),
  //
  // [nodeDefPropUpdate]: (state, {nodeDefUUID, key, value}) => assocNodeDefProp(nodeDefUUID, key, value)(state),
  //
  // [nodeDefDelete]: (state, {nodeDef}) => dissocNodeDef(nodeDef)(state),
  //
  //  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),
  //
  //
  // //CODE LIST
  // [codeListsUpdate]: (state, {codeLists}) => assocCodeLists(codeLists)(state),
  //
  // [codeListEditUpdate]: (state, {codeListUUID}) => assocCodeListEdit(codeListUUID)(state),
  //
  // [codeListEditActiveLevelItemUpdate]: (state, {levelIndex, itemUUID}) => assocActiveLevelItem(levelIndex, itemUUID)(state),
  //
  // [codeListEditLevelItemsUpdate]: (state, {levelIndex, items}) =>
  //   items === null
  //     ? dissocCodeListEditLevelItems(levelIndex)(state)
  //     : assocLevelItems(levelIndex, items)(state),
  //
  // //TAXONOMY
  // [taxonomiesUpdate]: (state, {taxonomies}) => assocSurveyTaxonomies(taxonomies)(state),
  //
  // [taxonomyEditUpdate]: (state, {type, ...otherProps}) => updateTaxonomyEdit(otherProps)(state),
  //
  // //RECORD
  // [recordUpdate]: assocActionProps,
  //
  // [nodesUpdate]: (state, {nodes}) => assocNodes(nodes)(state),
  //
  // [nodeDelete]: (state, {node}) => deleteNode(node)(state),

}

export default exportReducer(actionHandlers)