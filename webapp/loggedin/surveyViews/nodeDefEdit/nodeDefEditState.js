import * as R from 'ramda'

import * as SurveyViewsState from '../surveyViewsState'

const keys = {
  nodeDefOriginal: 'nodeDefOriginal', // Node def as it is when editing started
  nodeDef: 'nodeDef', // Node def currently being edited
  nodeDefValidation: 'nodeDefValidation', // Node def validation
  propsUpdated: 'propsUpdated', // Updated props
  propsAdvancedUpdated: 'propsAdvancedUpdated', // Updated props advanced
}

export const stateKey = 'nodeDefEdit'

const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue) => R.pipe(getState, R.propOr(defaultValue, prop))

// ===== READ

export const getNodeDefOriginal = getStateProp(keys.nodeDefOriginal)
export const getNodeDef = getStateProp(keys.nodeDef)
export const getNodeDefValidation = getStateProp(keys.nodeDefValidation)
export const getPropsUpdated = getStateProp(keys.propsUpdated, {})
export const getPropsAdvancedUpdated = getStateProp(keys.propsAdvancedUpdated, {})

// ===== UTILS
/**
 * Returns true if nodeDef and nodeDefOriginal are not equals
 */
export const isDirty = R.pipe(R.converge(R.pipe(R.equals, R.not), [getNodeDefOriginal, getNodeDef]))

// ===== UPDATE

const _assocNodeDef = nodeDef => R.assoc(keys.nodeDef, nodeDef)

const _assocNodeDefAndValidation = (nodeDef, nodeDefValidation) =>
  R.pipe(_assocNodeDef(nodeDef), R.assoc(keys.nodeDefValidation, nodeDefValidation))

export const assocNodeDefForEdit = (nodeDef, nodeDefValidation) =>
  R.pipe(R.assoc(keys.nodeDefOriginal, nodeDef), _assocNodeDefAndValidation(nodeDef, nodeDefValidation))

const _mergeProps = (props, propsAdvanced) => state => {
  const propsOld = R.prop(keys.propsUpdated, state)
  const propsAdvancedOld = R.prop(keys.propsAdvancedUpdated, state)
  return R.pipe(
    R.assoc(keys.propsUpdated, R.mergeLeft(props, propsOld)),
    R.assoc(keys.propsAdvancedUpdated, R.mergeLeft(propsAdvanced, propsAdvancedOld)),
  )(state)
}

export const assocNodeDefProps = (nodeDef, nodeDefValidation, props, propsAdvanced) => state =>
  R.pipe(_assocNodeDefAndValidation(nodeDef, nodeDefValidation), _mergeProps(props, propsAdvanced))(state)
