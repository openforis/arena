export const functionNames = {
  avg: 'avg',
  count: 'count',
  includes: 'includes',
  index: 'index',
  isEmpty: 'isEmpty',
  ln: 'ln',
  log10: 'log10',
  max: 'max',
  min: 'min',
  now: 'now',
  pow: 'pow',
  sum: 'sum',
}

export const functions = {
  [functionNames.avg]: { minArity: 1, maxArity: 1 },
  [functionNames.count]: { minArity: 1, maxArity: 1 },
  [functionNames.includes]: { minArity: 2, maxArity: 2 },
  [functionNames.index]: { minArity: 0, maxArity: 0 },
  [functionNames.isEmpty]: { minArity: 1, maxArity: 1 },
  [functionNames.ln]: { minArity: 1 },
  [functionNames.log10]: { minArity: 1 },
  [functionNames.max]: { minArity: 1, maxArity: -1 },
  [functionNames.min]: { minArity: 1, maxArity: -1 },
  [functionNames.now]: { minArity: 0, maxArity: 0 },
  [functionNames.pow]: { minArity: 2 },
  [functionNames.sum]: { minArity: 1, maxArity: 1 },
}
