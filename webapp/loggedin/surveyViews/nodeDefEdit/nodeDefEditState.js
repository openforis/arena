import * as R from 'ramda'

import * as SurveyViewsState from '../surveyViewsState'

const keys = {
  nodeDefOriginal: 'nodeDefOriginal',
  nodeDef: 'nodeDef',
  nodeDefValidation: 'nodeDefValidation',
  propsUpdated: 'propsUpdated',
  propsAdvancedUpdated: 'propsAdvancedUpdated',
}

export const stateKey = 'nodeDefEdit'

const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = prop => R.pipe(getState, R.prop(prop))

// ===== READ

export const getNodeDef = getStateProp(keys.nodeDef)
export const getNodeDefValidation = getStateProp(keys.nodeDefValidation)
export const getPropsUpdated = getStateProp(keys.propsUpdated)
export const getPropsAdvancedUpdated = getStateProp(keys.propsAdvancedUpdated)

// ===== UPDATE

const assocNodeDef = nodeDef => R.pipe(R.assoc(keys.nodeDefOriginal, nodeDef), R.assoc(keys.nodeDef, nodeDef))

export const assocNodeDefAndValidation = (nodeDef, nodeDefValidation) => state =>
  R.pipe(assocNodeDef(nodeDef), R.assoc(keys.nodeDefValidation, nodeDefValidation))(state)

const _mergeProps = (props, propsAdvanced) => state => {
  const propsOld = getPropsUpdated(state)
  const propsAdvancedOld = getPropsAdvancedUpdated(state)
  return R.pipe(
    R.assoc(keys.propsAdvancedUpdated, R.mergeLeft(props, propsOld)),
    R.assoc(keys.propsAdvancedUpdated, R.mergeLeft(propsAdvanced, propsAdvancedOld)),
  )(state)
}

export const assocNodeDefProps = (nodeDef, nodeDefValidation, props, propsAdvanced) => state =>
  R.pipe(assocNodeDefAndValidation(nodeDef, nodeDefValidation), _mergeProps(props, propsAdvanced))(state)
