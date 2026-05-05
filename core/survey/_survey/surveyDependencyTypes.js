export const dependencyTypes = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  fileName: 'fileName',
  formula: 'formula',
  itemsFilter: 'itemsFilter',
  maxCount: 'maxCount',
  minCount: 'minCount',
  parentCode: 'parentCode',
  validations: 'validations',
}

export const isContextParentByDependencyType = {
  [dependencyTypes.applicable]: true,
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.fileName]: true,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: true,
  [dependencyTypes.maxCount]: true,
  [dependencyTypes.minCount]: true,
  [dependencyTypes.parentCode]: false,
  [dependencyTypes.validations]: false,
}

export const selfReferenceAllowedByDependencyType = {
  [dependencyTypes.applicable]: false,
  [dependencyTypes.defaultValues]: false,
  [dependencyTypes.fileName]: false,
  [dependencyTypes.formula]: false,
  [dependencyTypes.itemsFilter]: false,
  [dependencyTypes.maxCount]: false,
  [dependencyTypes.minCount]: false,
  [dependencyTypes.parentCode]: false,
  [dependencyTypes.validations]: true,
}
