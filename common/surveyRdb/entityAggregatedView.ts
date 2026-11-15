import type { NodeDef as ArenaNodeDef, NodeDefType } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'

type AnyNodeDef = ArenaNodeDef<NodeDefType>

export interface EntityAggregatedView {
  entityDef: AnyNodeDef
  calculations: unknown[]
}

const keys = {
  entityDef: 'entityDef',
  calculations: 'calculations',
} as const

// ===== CREATE
export const newEntityAggregatedView = (entityDef: AnyNodeDef, calculations: unknown[] = []): EntityAggregatedView => ({
  [keys.entityDef]: entityDef,
  [keys.calculations]: calculations,
})

// ===== READ
export const getEntityDef = (view: EntityAggregatedView): AnyNodeDef => A.propOr([], keys.entityDef)(view)
export const getCalculations = (view: EntityAggregatedView): unknown[] => A.propOr([], keys.calculations)(view)

// ===== UPDATE
export const addCalculation =
  (calculation: unknown) =>
  (view: EntityAggregatedView): EntityAggregatedView => ({
    ...view,
    [keys.calculations]: [...(view[keys.calculations] ?? []), calculation],
  })

// ===== UTILS
export const getViewName = (entityAggregatedView: EntityAggregatedView): string =>
  `data_${NodeDef.getName(getEntityDef(entityAggregatedView))}_agg_view`
