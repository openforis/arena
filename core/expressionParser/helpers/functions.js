export const functionNames = {
  avg: 'avg',
  categoryItemProp: 'categoryItemProp',
  count: 'count',
  distance: 'distance',
  includes: 'includes',
  index: 'index',
  isEmpty: 'isEmpty',
  ln: 'ln',
  log10: 'log10',
  max: 'max',
  min: 'min',
  now: 'now',
  parent: 'parent',
  pow: 'pow',
  sum: 'sum',
  taxonProp: 'taxonProp',
  uuid: 'uuid',
}

/**
 * Function descriptors.
 * Function descriptor type:
 * - minArity (mandatory): minimum number of arguments
 * - maxArity: maximum number of arguments. If undefined or -1, infinite number of arguments is allowed.
 * - evaluateArgsToNodes (default false): if true, the arguments of the function will be evaluated to the record nodes, not to the node values.
 */
export const functions = {
  [functionNames.avg]: { minArity: 1, maxArity: 1 },
  [functionNames.categoryItemProp]: { minArity: 3, maxArity: -1 },
  [functionNames.count]: { minArity: 1, maxArity: 1 },
  [functionNames.distance]: { minArity: 2, maxArity: 2 },
  [functionNames.includes]: { minArity: 2, maxArity: 2 },
  [functionNames.index]: { minArity: 1, maxArity: 1, evaluateArgsToNodes: true },
  [functionNames.isEmpty]: { minArity: 1, maxArity: 1 },
  [functionNames.ln]: { minArity: 1 },
  [functionNames.log10]: { minArity: 1 },
  [functionNames.max]: { minArity: 1, maxArity: -1 },
  [functionNames.min]: { minArity: 1, maxArity: -1 },
  [functionNames.now]: { minArity: 0, maxArity: 0 },
  [functionNames.parent]: { minArity: 1, maxArity: 1, evaluateArgsToNodes: true },
  [functionNames.pow]: { minArity: 2 },
  [functionNames.sum]: { minArity: 1, maxArity: 1 },
  [functionNames.taxonProp]: { minArity: 3, maxArity: 3 },
}
