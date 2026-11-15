import type {
  NodeDefCountExpression,
  NodeDefExpression,
  NodeDefValidations as ArenaNodeDefValidations,
} from '@openforis/arena-core'

import * as A from '@core/arena'

type ValidationsUpdater = (validations: ArenaNodeDefValidations) => ArenaNodeDefValidations

export const keys = {
  count: 'count',
  expressions: 'expressions',
  max: 'max',
  min: 'min',
  required: 'required',
  requiredIf: 'requiredIf',
  unique: 'unique',
} as const

// COUNT
export const dissocCount: ValidationsUpdater = A.dissoc(keys.count)

export const getCountProp =
  (key: string) =>
  (validations: ArenaNodeDefValidations): NodeDefCountExpression | '' =>
    A.pathOr('', [keys.count, key])(validations)

export const getMinCount = getCountProp(keys.min)

export const getMaxCount = getCountProp(keys.max)

export const assocCountProp =
  (key: string) =>
  (value: NodeDefCountExpression | null | undefined): ValidationsUpdater =>
    A.pipe(
      A.ifElse(A.always(A.isEmpty(value)), A.dissocPath([keys.count, key]), A.assocPath([keys.count, key], value)),
      // If validations count obj is empty, it gets removed from validations
      A.ifElse(A.pipe(A.prop(keys.count), A.isEmpty), dissocCount, A.identity)
    )

export const assocMinCount = assocCountProp(keys.min)
export const assocMaxCount = assocCountProp(keys.max)

// REQUIRED
export const isRequired = (validations: ArenaNodeDefValidations): boolean =>
  A.propOr(false, keys.required)(validations) as boolean
export const assocRequired =
  (required: boolean): ValidationsUpdater =>
  (validations) =>
    A.assoc(keys.required, required, validations)
export const dissocRequired: ValidationsUpdater = A.dissoc(keys.required)

// REQUIRED IF (alternative to required: required only when a condition is met)
export const getRequiredIf = (validations: ArenaNodeDefValidations): NodeDefExpression[] =>
  A.propOr([], keys.requiredIf)(validations) as NodeDefExpression[]
export const isRequiredIfDefined = (validations: ArenaNodeDefValidations): boolean =>
  !A.isEmpty(getRequiredIf(validations))
export const dissocRequiredIf: ValidationsUpdater = A.dissoc(keys.requiredIf)
export const assocRequiredIf = (expressions: NodeDefExpression[]): ValidationsUpdater =>
  A.isEmpty(expressions) ? dissocRequiredIf : (validations) => A.assoc(keys.requiredIf, expressions, validations)

// UNIQUE
export const isUnique = (validations: ArenaNodeDefValidations): boolean =>
  A.propOr(false, keys.unique)(validations) as boolean
export const assocUnique =
  (unique: boolean): ValidationsUpdater =>
  (validations) =>
    A.assoc(keys.unique, unique, validations)
export const dissocUnique: ValidationsUpdater = A.dissoc(keys.unique)

// EXPRESSIONS
export const getExpressions = (validations: ArenaNodeDefValidations): NodeDefExpression[] =>
  A.propOr([], keys.expressions)(validations) as NodeDefExpression[]
export const assocExpressions =
  (expressions: NodeDefExpression[]): ValidationsUpdater =>
  (validations) =>
    A.assoc(keys.expressions, expressions, validations)
