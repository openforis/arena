import * as A from '@core/arena'

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
export const getEntityDef = A.propOr([], keys.entityDef)
export const getCalculations = A.propOr([], keys.calculations)

// ===== UPDATE
export const addCalculation = (calculation) => (view) =>
  A.assoc(keys.calculations, A.append(calculation, view[keys.calculations] ?? []), view)

// ===== UTILS
export const getViewName = (entityAggregatedView) =>
  `data_${A.pipe(getEntityDef, NodeDef.getName)(entityAggregatedView)}_agg_view`
