import * as R from 'ramda'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

const keys = {
  nodeDef: 'nodeDef', // Node def currently being edited
  nodeDefOriginal: 'nodeDefOriginal', // Node def as it is when editing started (used when canceling edits)
  validation: 'validation', // Node def validation
}

// ===== READ

export const getNodeDef = A.propOr({}, keys.nodeDef)
export const getNodeDefOriginal = A.propOr({}, keys.nodeDefOriginal)
export const getValidation = A.propOr(Validation.newInstance(), keys.validation)

// ===== UTILS
/**
 * Determines if the nodeDef in the state has been updated.
 *
 * @param {!object} state - The node def state object.
 * @returns {boolean} - True when nodeDef and nodeDefOriginal are not equals.
 */
export const isDirty = (state) => {
  const nodeDef = getNodeDef(state)
  return nodeDef && (NodeDef.isTemporary(nodeDef) || !R.equals(nodeDef, getNodeDefOriginal(state)))
}

export const getPropsUpdated = (state) => {
  const propsOriginal = NodeDef.getProps(getNodeDefOriginal(state))
  const props = NodeDef.getProps(getNodeDef(state))
  return R.fromPairs(R.difference(R.toPairs(props), R.toPairs(propsOriginal)))
}

export const getPropsAdvancedUpdated = (state) => {
  const propsAdvancedOriginal = NodeDef.getPropsAdvanced(getNodeDefOriginal(state))
  const propsAdvanced = NodeDef.getPropsAdvanced(getNodeDef(state))
  return R.fromPairs(R.difference(R.toPairs(propsAdvanced), R.toPairs(propsAdvancedOriginal)))
}

// ===== UPDATE

export const assocNodeDefAndValidation = (nodeDef, nodeDefValidation) =>
  R.pipe(R.assoc(keys.nodeDef, nodeDef), R.assoc(keys.validation, nodeDefValidation))

export const assocNodeDefForEdit = (nodeDef, nodeDefValidation) =>
  R.pipe(R.assoc(keys.nodeDefOriginal, nodeDef), assocNodeDefAndValidation(nodeDef, nodeDefValidation))
