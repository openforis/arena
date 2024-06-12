export const dependencyTypes = {
  defaultValues: 'defaultValues',
  applicable: 'applicable',
  validations: 'validations',
  formula: 'formula',
  itemsFilter: 'itemsFilter',
  maxCount: 'maxCount',
  minCount: 'minCount',
}

export const isContextParentByDependencyType = {
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.applicable]: true,
  [dependencyTypes.validations]: false,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: true,
  [dependencyTypes.maxCount]: true,
  [dependencyTypes.minCount]: true,
}

export const selfReferenceAllowedByDependencyType = {
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.applicable]: false,
  [dependencyTypes.validations]: true,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: false,
  [dependencyTypes.maxCount]: false,
  [dependencyTypes.minCount]: false,
}
