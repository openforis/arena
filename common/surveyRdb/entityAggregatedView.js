import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

const keys = {
  entityDef: 'entityDef',
  calculations: 'calculations',
}

// ===== CREATE
export const newEntityAggregatedView = (entityDef, calculations = []) => ({
  [keys.entityDef]: entityDef,
  [keys.calculations]: calculations,
})

// ===== READ
export const getEntityDef = R.propOr([], keys.entityDef)
export const getCalculations = R.propOr([], keys.calculations)

// ===== UPDATE
export const addCalculation = (calculation) => R.over(R.lens(keys.calculations), R.append(calculation))

// ===== UTILS
export const getViewName = (entityAggregatedView) =>
  `data_${R.pipe(getEntityDef, NodeDef.getName)(entityAggregatedView)}_agg_view`
