import * as R from 'ramda'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'

const keys = {
  nodeDef: 'nodeDef', // Node def currently being edited
  nodeDefOriginal: 'nodeDefOriginal', // Node def as it is when editing started (used when canceling edits)
  propsUpdated: 'propsUpdated', // Updated props
  propsAdvancedUpdated: 'propsAdvancedUpdated', // Updated props advanced
  validation: 'validation', // Node def validation
}

// ===== READ

export const getNodeDef = A.propOr({}, keys.nodeDef)
export const getNodeDefOriginal = A.propOr({}, keys.nodeDefOriginal)
export const getValidation = A.propOr(Validation.newInstance(), keys.validation)
export const getPropsUpdated = A.propOr({}, keys.propsUpdated)
export const getPropsAdvancedUpdated = A.propOr({}, keys.propsAdvancedUpdated)

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

// ===== UPDATE

const _assocNodeDef = (nodeDef) => R.assoc(keys.nodeDef, nodeDef)

const _assocNodeDefAndValidation = (nodeDef, nodeDefValidation) =>
  R.pipe(_assocNodeDef(nodeDef), R.assoc(keys.validation, nodeDefValidation))

export const assocNodeDefForEdit = (nodeDef, nodeDefValidation) =>
  R.pipe(
    R.assoc(keys.nodeDefOriginal, nodeDef),
    _assocNodeDefAndValidation(nodeDef, nodeDefValidation),
    R.dissoc(keys.propsUpdated),
    R.dissoc(keys.propsAdvancedUpdated)
  )

const _mergeProps = (props, propsAdvanced) => (state) => {
  const propsOld = R.prop(keys.propsUpdated, state)
  const propsAdvancedOld = R.prop(keys.propsAdvancedUpdated, state)
  return R.pipe(
    R.assoc(keys.propsUpdated, R.mergeLeft(props, propsOld)),
    R.assoc(keys.propsAdvancedUpdated, R.mergeLeft(propsAdvanced, propsAdvancedOld))
  )(state)
}

export const assocNodeDefProps = (nodeDef, nodeDefValidation, props, propsAdvanced) => (state) =>
  R.pipe(_assocNodeDefAndValidation(nodeDef, nodeDefValidation), _mergeProps(props, propsAdvanced))(state)
